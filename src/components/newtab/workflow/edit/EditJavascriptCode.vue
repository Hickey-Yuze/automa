<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      autoresize
      :placeholder="t('common.description')"
      class="mb-1 w-full"
      @change="updateData({ description: $event })"
    />
    <template v-if="!data.everyNewTab">
      <ui-input
        :model-value="data.timeout"
        :label="t('workflow.blocks.javascript-code.timeout.placeholder')"
        :title="t('workflow.blocks.javascript-code.timeout.title')"
        type="number"
        class="mb-2 w-full"
        @change="updateData({ timeout: +$event })"
      />
      <ui-select
        v-if="
          !isFirefox &&
          (!workflow?.data?.value.settings?.execContext ||
            workflow?.data?.value.settings?.execContext === 'popup')
        "
        :model-value="data.context"
        :label="t('workflow.blocks.javascript-code.context.name')"
        class="mb-2 w-full"
        @change="updateData({ context: $event })"
      >
        <option
          v-for="item in ['website', 'background']"
          :key="item"
          :value="item"
        >
          {{ t(`workflow.blocks.javascript-code.context.items.${item}`) }}
        </option>
      </ui-select>
    </template>
    <p class="ml-1 text-sm text-gray-600 dark:text-gray-200">
      {{ t('workflow.blocks.javascript-code.name') }}
    </p>
    <pre
      v-if="!state.showCodeModal"
      class="max-h-80 overflow-auto rounded-lg bg-gray-900 p-4 text-gray-200"
      @click="state.showCodeModal = true"
      v-text="data.code"
    />
    <template v-if="isFirefox || data.context !== 'background'">
      <ui-checkbox
        :model-value="data.everyNewTab"
        class="mt-2"
        @change="updateData({ everyNewTab: $event })"
      >
        {{ t('workflow.blocks.javascript-code.everyNewTab') }}
      </ui-checkbox>
      <ui-checkbox
        :model-value="data.runBeforeLoad"
        class="mt-2"
        @change="updateData({ runBeforeLoad: $event })"
      >
        {{ t('workflow.edit.javascriptCode.runBeforeLoad') }}
      </ui-checkbox>
    </template>
    <ui-modal v-model="state.showCodeModal" content-class="max-w-4xl">
      <template #header>
        <ui-tabs v-model="state.activeTab" class="border-none">
          <ui-tab value="code">
            {{ t('workflow.blocks.javascript-code.modal.tabs.code') }}
          </ui-tab>
          <ui-tab value="preloadScript">
            {{ t('workflow.blocks.javascript-code.modal.tabs.preloadScript') }}
          </ui-tab>
        </ui-tabs>
      </template>
      <ui-tab-panels
        v-model="state.activeTab"
        class="overflow-auto"
        style="height: calc(100vh - 9rem)"
      >
        <ui-tab-panel value="code" class="h-full">
          <shared-codemirror
            v-model="state.code"
            :extensions="codemirrorExts"
            :style="{ height: data.everyNewTab ? '100%' : '87%' }"
            class="overflow-auto"
          />
          <template v-if="!data.everyNewTab">
            <p class="mt-1 flex justify-between text-sm">
              <span>{{
                t('workflow.blocks.javascript-code.availabeFuncs')
              }}</span>
              <span>
                <span
                  class="cursor-pointer select-none underline"
                  @click="modifyWhiteSpace"
                  >{{ t('workflow.edit.javascriptCode.wrapLine') }}</span
                >
              </span>
            </p>
            <p
              class="scroll space-x-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1"
            >
              <button
                v-for="func in availableFuncs"
                :key="func.name"
                type="button"
                class="inline-block cursor-pointer transition-opacity duration-150 hover:opacity-80 active:scale-95"
                @click="
                  state.activeApi =
                    state.activeApi === func.name ? '' : func.name
                "
              >
                <code
                  :class="
                    state.activeApi === func.name ? 'ring-1 ring-blue-400' : ''
                  "
                  >{{ func.name }}</code
                >
              </button>
            </p>
            <div
              v-if="activeDoc"
              class="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div class="flex items-center justify-between gap-2">
                <code class="text-blue-600 dark:text-blue-300">{{
                  activeDoc.signature
                }}</code>
                <a
                  v-if="activeDoc.anchor"
                  :href="`https://docs.extension.automa.site/blocks/javascript-code.html#${activeDoc.anchor}`"
                  target="_blank"
                  rel="noopener"
                  class="shrink-0 text-xs underline hover:opacity-80"
                  >{{ uiLabels.viewOnline }}</a
                >
              </div>
              <p class="mt-2">{{ activeDoc.desc }}</p>
              <table
                v-if="activeDoc.params.length"
                class="mt-2 w-full text-left"
              >
                <thead>
                  <tr class="text-xs text-gray-500">
                    <th class="pr-3 font-medium">{{ uiLabels.params }}</th>
                    <th class="pr-3 font-medium"></th>
                    <th class="font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="param in activeDoc.params" :key="param.name">
                    <td class="pr-3 align-top">
                      <code>{{ param.name }}</code>
                    </td>
                    <td class="pr-3 align-top text-xs text-gray-500">
                      {{ param.type }}
                    </td>
                    <td class="align-top">{{ param.desc }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="mt-2">
                <b>{{ uiLabels.returns }}</b
                >：{{ activeDoc.returns }}
              </p>
              <pre
                class="mt-2 overflow-auto rounded-lg bg-gray-900 p-2 text-xs text-gray-200"
                v-text="activeDoc.example"
              />
              <div class="mt-2 flex items-center justify-between gap-2">
                <span class="text-xs text-gray-500">{{
                  contextText(activeDoc)
                }}</span>
                <ui-button
                  variant="accent"
                  class="h-7 px-2 text-xs transition-transform duration-150 active:scale-95"
                  @click="insertExample(activeDoc)"
                >
                  {{ uiLabels.insert }}
                </ui-button>
              </div>
            </div>
          </template>
        </ui-tab-panel>
        <ui-tab-panel value="preloadScript">
          <div
            v-for="(script, index) in state.preloadScripts"
            :key="index"
            class="mt-4 flex items-center"
          >
            <v-remixicon
              name="riDeleteBin7Line"
              class="mr-2 cursor-pointer"
              @click="state.preloadScripts.splice(index, 1)"
            />
            <ui-input
              v-model="state.preloadScripts[index].src"
              placeholder="http://example.com/script.js"
              class="mr-4 flex-1"
            />
            <ui-checkbox
              v-if="
                (!data.everyNewTab || data.context !== 'website') && !isFirefox
              "
              v-model="state.preloadScripts[index].removeAfterExec"
            >
              {{ t('workflow.blocks.javascript-code.removeAfterExec') }}
            </ui-checkbox>
          </div>
          <ui-button variant="accent" class="mt-4 w-20" @click="addScript">
            {{ t('common.add') }}
          </ui-button>
        </ui-tab-panel>
      </ui-tab-panels>
    </ui-modal>
  </div>
</template>
<script setup>
import {
  automaFuncsCompletion,
  automaFuncsSnippets,
  completeFromGlobalScope,
} from '@/utils/codeEditorAutocomplete';
import { contextLabels, jsApiDocs, uiLabels } from '@/utils/jsApiDocs';
import { autocompletion } from '@codemirror/autocomplete';
import { computed, defineAsyncComponent, inject, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { store } from '../../settings/jsBlockWrap';

function modifyWhiteSpace() {
  if (store.whiteSpace === 'pre') {
    store.whiteSpace = 'pre-wrap';
  } else {
    store.whiteSpace = 'pre';
  }
}

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const isFirefox = BROWSER_TYPE === 'firefox';

const state = reactive({
  activeTab: 'code',
  code: `${props.data.code}`,
  preloadScripts: [...Object.values(props.data.preloadScripts || [])],
  showCodeModal: false,
  activeApi: '',
});

// JS 代码块实际可用的函数集（以 handlerJavascriptCode.js 的 getAutomaScript 为准）；
// automaExecWorkflow 仅「注入 JavaScript」块可用，故不在此列
const availableFuncs = jsApiDocs.filter((doc) =>
  doc.contexts.includes('js-block')
);
const autocompleteList = availableFuncs.map(
  (doc) => automaFuncsSnippets[doc.name]
);
const activeDoc = computed(() =>
  jsApiDocs.find((doc) => doc.name === state.activeApi)
);

function contextText(doc) {
  return doc.contexts
    .map((item) => contextLabels[item])
    .filter(Boolean)
    .join('；');
}
function insertExample(doc) {
  state.code = `${state.code}\n${doc.example}`;
}

const workflow = inject('workflow');

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addScript() {
  state.preloadScripts.push({ src: '', removeAfterExec: true });
}

const codemirrorExts = [
  autocompletion({
    override: [
      automaFuncsCompletion(autocompleteList),
      completeFromGlobalScope,
    ],
  }),
];

watch(
  () => state.code,
  (value) => {
    updateData({ code: value });
  }
);
watch(
  () => state.preloadScripts,
  (value) => {
    updateData({ preloadScripts: value });
  },
  { deep: true }
);
</script>
<style scoped>
code {
  @apply bg-gray-900 text-sm text-white p-1 rounded-md;
}
</style>
