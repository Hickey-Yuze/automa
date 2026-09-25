import { fetchApi } from '@/utils/api';
import firstWorkflows from '@/utils/firstWorkflows';
import { tasks } from '@/utils/shared';
import {
  cleanWorkflowTriggers,
  registerWorkflowTrigger,
} from '@/utils/workflowTrigger';
import dayjs from 'dayjs';
import defu from 'defu';
import deepmerge from 'lodash.merge';
import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';
import browser from 'webextension-polyfill';
import { useUserStore } from './user';

const defaultWorkflow = (data = null, options = {}) => {
  let workflowData = {
    id: nanoid(),
    name: '',
    icon: 'riGlobalLine',
    folderId: null,
    content: null,
    connectedTable: null,
    drawflow: {
      edges: [],
      zoom: 1.3,
      nodes: [
        {
          position: {
            x: 100,
            y: window.innerHeight / 2,
          },
          id: nanoid(),
          label: 'trigger',
          data: tasks.trigger.data,
          type: tasks.trigger.component,
        },
      ],
    },
    table: [],
    dataColumns: [],
    description: '',
    trigger: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDisabled: false,
    settings: {
      publicId: '',
      aipowerToken: '',
      blockDelay: 0,
      saveLog: true,
      debugMode: false,
      restartTimes: 3,
      notification: true,
      execContext: 'popup',
      reuseLastState: false,
      inputAutocomplete: true,
      onError: 'stop-workflow',
      executedBlockOnWeb: false,
      insertDefaultColumn: false,
      defaultColumnName: 'column',
    },
    version: browser.runtime.getManifest().version,
    globalData: '{\n\t"key": "value"\n}',
  };

  if (data) {
    if (options.duplicateId && data.id) {
      delete workflowData.id;
    }

    if (data.drawflow?.nodes?.length > 0) {
      workflowData.drawflow.nodes = [];
    }

    workflowData = defu(data, workflowData);
  }

  return workflowData;
};

function convertWorkflowsToObject(workflows) {
  if (Array.isArray(workflows)) {
    return workflows.reduce((acc, workflow) => {
      acc[workflow.id] = workflow;

      return acc;
    }, {});
  }

  return workflows;
}

export const useWorkflowStore = defineStore('workflow', {
  storageMap: {
    workflows: 'workflows',
  },
  state: () => ({
    states: [],
    workflows: {},
    popupStates: [],
    retrieved: false,
    isFirstTime: false,
  }),
  getters: {
    getAllStates: (state) => [...state.popupStates, ...state.states],
    getById: (state) => (id) => state.workflows[id],
    getWorkflows: (state) => Object.values(state.workflows),
    getWorkflowStates: (state) => (id) =>
      [...state.states, ...state.popupStates].filter(
        ({ workflowId }) => workflowId === id
      ),
  },
  actions: {
    async loadData() {
      const { workflows, isFirstTime } = await browser.storage.local.get([
        'workflows',
        'isFirstTime',
      ]);

      let localWorkflows = workflows || {};

      if (isFirstTime) {
        localWorkflows = firstWorkflows.map((workflow) =>
          defaultWorkflow(workflow)
        );
        await browser.storage.local.set({
          isFirstTime: false,
          workflows: localWorkflows,
        });
      }

      this.isFirstTime = isFirstTime;
      this.workflows = convertWorkflowsToObject(localWorkflows);

      this.retrieved = true;
    },
    updateStates(newStates) {
      this.states = newStates;
    },
    async insert(data = {}, options = {}) {
      const insertedWorkflows = {};

      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (!options.duplicateId) {
            delete item.id;
          }

          const workflow = defaultWorkflow(item, options);
          this.workflows[workflow.id] = workflow;
          insertedWorkflows[workflow.id] = workflow;
        });
      } else {
        if (!options.duplicateId) {
          delete data.id;
        }

        const workflow = defaultWorkflow(data, options);
        this.workflows[workflow.id] = workflow;
        insertedWorkflows[workflow.id] = workflow;
      }

      await this.saveToStorage('workflows');

      return insertedWorkflows;
    },
    async update({ id, data = {}, deep = false }) {
      const isFunction = typeof id === 'function';
      if (!isFunction && !this.workflows[id]) return null;

      const updatedWorkflows = {};
      const updateData = { ...data, updatedAt: Date.now() };

      const workflowUpdater = (workflowId) => {
        if (deep) {
          this.workflows[workflowId] = deepmerge(
            this.workflows[workflowId],
            updateData
          );
        } else {
          Object.assign(this.workflows[workflowId], updateData);
        }

        this.workflows[workflowId].updatedAt = Date.now();
        updatedWorkflows[workflowId] = this.workflows[workflowId];

        if (!('isDisabled' in data)) return;

        if (data.isDisabled) {
          cleanWorkflowTriggers(workflowId);
        } else {
          const triggerBlock = this.workflows[workflowId].drawflow.nodes?.find(
            (node) => node.label === 'trigger'
          );
          if (triggerBlock) {
            registerWorkflowTrigger(id, triggerBlock);
          }
        }
      };

      if (isFunction) {
        this.getWorkflows.forEach((workflow) => {
          const isMatch = id(workflow) ?? false;
          if (isMatch) workflowUpdater(workflow.id);
        });
      } else {
        workflowUpdater(id);
      }

      await this.saveToStorage('workflows');

      return updatedWorkflows;
    },
    async insertOrUpdate(
      data = [],
      { checkUpdateDate = false, duplicateId = false } = {}
    ) {
      const insertedData = {};

      data.forEach((item) => {
        const currentWorkflow = this.workflows[item.id];

        if (currentWorkflow) {
          let insert = true;
          if (checkUpdateDate && currentWorkflow.createdAt && item.updatedAt) {
            insert = dayjs(currentWorkflow.updatedAt).isBefore(item.updatedAt);
          }

          if (insert) {
            const mergedData = deepmerge(this.workflows[item.id], item);

            this.workflows[item.id] = mergedData;
            insertedData[item.id] = mergedData;
          }
        } else {
          const workflow = defaultWorkflow(item, { duplicateId });
          this.workflows[workflow.id] = workflow;
          insertedData[workflow.id] = workflow;
        }
      });

      await this.saveToStorage('workflows');

      return insertedData;
    },
    async delete(id) {
      if (Array.isArray(id)) {
        id.forEach((workflowId) => {
          delete this.workflows[workflowId];
        });
      } else {
        delete this.workflows[id];
      }

      await cleanWorkflowTriggers(id);

      const userStore = useUserStore();

      const hostedWorkflow = userStore.hostedWorkflows[id];
      const backupIndex = userStore.backupIds.indexOf(id);

      if (hostedWorkflow || backupIndex !== -1) {
        const response = await fetchApi(`/me/workflows?id=${id}`, {
          auth: true,
          method: 'DELETE',
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message);
        }

        if (backupIndex !== -1) {
          userStore.backupIds.splice(backupIndex, 1);
          await browser.storage.local.set({ backupIds: userStore.backupIds });
        }
      }

      await browser.storage.local.remove([
        `state:${id}`,
        `draft:${id}`,
        `draft-team:${id}`,
      ]);
      await this.saveToStorage('workflows');

      const { pinnedWorkflows } = await browser.storage.local.get(
        'pinnedWorkflows'
      );
      const pinnedWorkflowIndex = pinnedWorkflows
        ? pinnedWorkflows.indexOf(id)
        : -1;
      if (pinnedWorkflowIndex !== -1) {
        pinnedWorkflows.splice(pinnedWorkflowIndex, 1);
        await browser.storage.local.set({ pinnedWorkflows });
      }

      return id;
    },
    // ===== 回收站：误删工作流可还原（保留 30 天，上限 50 条） =====
    async getRecycleBin() {
      const { workflowRecycleBin: items = [] } =
        await browser.storage.local.get('workflowRecycleBin');
      const now = Date.now();
      const validItems = items.filter(
        (item) => now - item.deletedAt < 30 * 24 * 60 * 60 * 1000
      );

      if (validItems.length !== items.length) {
        await browser.storage.local.set({
          workflowRecycleBin: validItems,
        });
      }

      return validItems;
    },
    async deleteToBin(id) {
      const workflow = this.workflows[id];
      if (!workflow) return this.delete(id);

      const items = await this.getRecycleBin();
      items.unshift({
        id: `${id}-${Date.now()}`,
        workflowId: id,
        name: workflow.name,
        data: JSON.parse(JSON.stringify(workflow)),
        deletedAt: Date.now(),
      });
      if (items.length > 50) items.length = 50;
      await browser.storage.local.set({ workflowRecycleBin: items });

      return this.delete(id);
    },
    async restoreFromBin(itemId) {
      const items = await this.getRecycleBin();
      const item = items.find(({ id }) => id === itemId);
      if (!item) return false;

      let { workflowId } = item;
      if (this.workflows[workflowId]) {
        // 同 id 已被占用（理论上几乎不可能），换新 id 还原
        workflowId = nanoid();
        item.data.id = workflowId;
      }
      this.workflows[workflowId] = item.data;
      await this.saveToStorage('workflows');
      await browser.storage.local.set({
        workflowRecycleBin: items.filter(({ id }) => id !== itemId),
      });

      return true;
    },
    async removeFromBin(itemId) {
      const items = await this.getRecycleBin();
      await browser.storage.local.set({
        workflowRecycleBin: items.filter(({ id }) => id !== itemId),
      });
    },
    async clearRecycleBin() {
      await browser.storage.local.set({ workflowRecycleBin: [] });
    },
  },
});
