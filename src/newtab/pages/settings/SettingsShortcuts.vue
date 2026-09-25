<template>
  <p v-if="recording.isChanged" class="mb-4 text-gray-600 dark:text-gray-200">
    {{ t('settings.language.reloadPage') }}
  </p>
  <div class="mb-8 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
    <p class="mb-2 font-semibold capitalize">Automa</p>
    <ui-list>
      <ui-list-item class="group">
        <p class="flex-1">快捷键</p>
        <template v-if="recording.id === 'automa:shortcut'">
          <kbd v-for="key in recording.keys" :key="key">
            {{ getReadableShortcut(key) }}
          </kbd>
          <button
            v-tooltip="t('common.cancel')"
            class="mr-2 ml-4"
            @click="cleanUp"
          >
            <v-remixicon name="riCloseLine" />
          </button>
          <button
            v-tooltip="t('workflow.blocks.trigger.shortcut.stopRecord')"
            @click="stopRecording"
          >
            <v-remixicon name="riStopLine" />
          </button>
        </template>
        <template v-else>
          <button
            v-tooltip="'移除快捷键'"
            class="invisible mr-4 group-hover:visible"
            @click="removeShortcut('automa:shortcut')"
          >
            <v-remixicon name="riDeleteBin7Line" />
          </button>
          <button
            v-tooltip="t('workflow.blocks.trigger.shortcut.tooltip')"
            class="invisible group-hover:visible"
            @click="startRecording({ id: 'automa:shortcut' })"
          >
            <v-remixicon name="riRecordCircleLine" />
          </button>
          <kbd v-for="key in automaShortcut.split('+')" :key="key">
            {{ key }}
          </kbd>
        </template>
      </ui-list-item>
    </ui-list>
  </div>
  <div
    v-for="(items, category) in shortcutsCats"
    :key="category"
    class="mb-8 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
  >
    <p class="mb-2 font-semibold capitalize">{{ category }}</p>
    <ui-list class="space-y-1 text-gray-600 dark:text-gray-200">
      <ui-list-item
        v-for="shortcut in items"
        :key="shortcut.id"
        class="group h-12"
      >
        <p class="mr-4 flex-1 capitalize">
          {{ shortcut.name }}
        </p>
        <template v-if="recording.id === shortcut.id">
          <kbd v-for="key in recording.keys" :key="key">
            {{ getReadableShortcut(key) }}
          </kbd>
          <button
            v-tooltip="t('common.cancel')"
            class="mr-2 ml-4"
            @click="cleanUp"
          >
            <v-remixicon name="riCloseLine" />
          </button>
          <button
            v-tooltip="t('workflow.blocks.trigger.shortcut.stopRecord')"
            @click="stopRecording"
          >
            <v-remixicon name="riStopLine" />
          </button>
        </template>
        <template v-else>
          <button
            v-tooltip="t('workflow.blocks.trigger.shortcut.tooltip')"
            class="invisible group-hover:visible"
            @click="startRecording(shortcut)"
          >
            <v-remixicon name="riRecordCircleLine" />
          </button>
          <kbd v-for="key in shortcut.keys" :key="key">
            {{ key }}
          </kbd>
        </template>
      </ui-list-item>
    </ui-list>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { mapShortcuts, getReadableShortcut } from '@/composable/shortcut';
import { recordShortcut } from '@/utils/recordKeys';

const { t } = useI18n();
const toast = useToast();

const shortcuts = ref(mapShortcuts);
const automaShortcut = ref(getReadableShortcut('mod+shift+e'));
const recording = reactive({
  id: '',
  keys: [],
  isChanged: false,
});

// 快捷键分组与条目的中文名（id 是英文短语，运行时生成，无 i18n key）
const CATEGORY_NAMES = {
  automa: 'Automa',
  page: '页面',
  action: '操作',
  editor: '编辑器',
};
const SHORTCUT_NAMES = {
  dashboard: '主页',
  workflows: '工作流',
  schedule: '计划',
  logs: '日志',
  storage: '存储',
  settings: '设置',
  search: '搜索',
  new: '新建',
  'duplicate block': '复制块',
  'search blocks': '搜索块',
  save: '保存',
  'execute workflow': '执行工作流',
  'toggle sidebar': '切换侧边栏',
  'record shortcut': '录制快捷键',
};

const shortcutsCats = computed(() => {
  const arr = Object.values(shortcuts.value);
  const result = {};

  arr.forEach((item) => {
    const [category, shortcutName] = item.id.split(':');
    const readableKey = getReadableShortcut(item.combo);
    const generatedName = shortcutName.replace('-', ' ');
    const name =
      SHORTCUT_NAMES[generatedName] ||
      SHORTCUT_NAMES[shortcutName] ||
      generatedName;

    (result[category] = result[category] || []).push({
      ...item,
      name,
      keys: readableKey.split('+'),
    });
  });

  const renamed = {};
  Object.entries(result).forEach(([key, value]) => {
    renamed[CATEGORY_NAMES[key] || key] = value;
  });

  return renamed;
});

function keydownListener(event) {
  event.preventDefault();
  event.stopPropagation();

  if (!recording.id) {
    document.removeEventListener('keydown', keydownListener, true);
    return;
  }

  recordShortcut(event, (keys) => {
    recording.keys = keys;
  });
}
function cleanUp() {
  recording.id = '';
  recording.keys = [];

  document.removeEventListener('keydown', keydownListener, true);
}
function startRecording({ id }) {
  if (!recording.id) {
    document.addEventListener('keydown', keydownListener, true);
  }

  recording.keys = [];
  recording.id = id;
}
function removeShortcut(shortcutId) {
  if (shortcutId !== 'automa:shortcut') return;

  browser.storage.local.set({ automaShortcut: [] });
  automaShortcut.value = '';
}
function stopRecording() {
  if (recording.keys.length === 0) return;

  const newCombo = recording.keys.join('+');

  if (recording.id.startsWith('automa')) {
    browser.storage.local.set({ automaShortcut: newCombo });
    automaShortcut.value = getReadableShortcut(newCombo);
    cleanUp();

    return;
  }

  const isDuplicate = Object.keys(shortcuts.value).find((key) => {
    return shortcuts.value[key].combo === newCombo && key !== recording.id;
  });

  if (isDuplicate) {
    toast.error(t('settings.shortcuts.duplicate', { name: isDuplicate }));

    return;
  }

  shortcuts.value[recording.id].combo = newCombo;
  cleanUp();

  recording.isChanged = true;

  localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value));
}

onMounted(() => {
  browser.storage.local.get('automaShortcut').then((storage) => {
    if (!storage.automaShortcut) return;

    automaShortcut.value = getReadableShortcut(storage.automaShortcut);
  });
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', keydownListener, true);
});
</script>
<style scoped>
kbd {
  min-width: 30px;
  text-align: center;
  text-transform: uppercase;
  @apply p-1 px-2 rounded-lg border text-sm shadow ml-1;
}
</style>
