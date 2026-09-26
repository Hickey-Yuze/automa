<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      autoresize
      :placeholder="t('common.description')"
      class="mb-1 w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.timeout"
      :label="t('workflow.blocks.python-code.timeout.placeholder')"
      :title="t('workflow.blocks.python-code.timeout.title')"
      type="number"
      class="mb-2 w-full"
      @change="updateData({ timeout: +$event })"
    />
    <ui-select
      :model-value="data.channel"
      :label="t('workflow.blocks.python-code.channel.name')"
      class="mb-2 w-full"
      @change="updateData({ channel: $event })"
    >
      <option
        v-for="item in ['auto', 'bridge', 'pyodide']"
        :key="item"
        :value="item"
      >
        {{ t(`workflow.blocks.python-code.channel.items.${item}`) }}
      </option>
    </ui-select>
    <p class="ml-1 text-sm text-gray-600 dark:text-gray-200">
      {{ t('workflow.blocks.python-code.name') }}
    </p>
    <pre
      v-if="!state.showCodeModal"
      class="max-h-80 overflow-auto rounded-lg bg-gray-900 p-4 text-gray-200"
      @click="state.showCodeModal = true"
      v-text="data.code"
    />
    <ui-modal v-model="state.showCodeModal" content-class="max-w-4xl">
      <template #header>
        <ui-tabs v-model="state.activeTab" class="border-none">
          <ui-tab value="code">
            {{ t('workflow.blocks.python-code.modal.tabs.code') }}
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
            style="height: 87%"
            class="overflow-auto"
          />
          <p class="mt-1 text-sm">
            {{ t('workflow.blocks.python-code.availabeFuncs') }}
          </p>
          <p
            class="scroll space-x-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1"
          >
            <code
              v-for="func in availableFuncs"
              :key="func.name"
              v-tooltip="{
                content: hoverDoc(func),
                allowHTML: true,
                maxWidth: 420,
                hideOnClick: false,
              }"
            >
              {{ func.name }}
            </code>
          </p>
        </ui-tab-panel>
      </ui-tab-panels>
    </ui-modal>
  </div>
</template>
<script setup>
import { python } from '@codemirror/lang-python';
import { autocompletion } from '@codemirror/autocomplete';
import { defineAsyncComponent, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  yuzeFuncsCompletion,
  yuzeFuncsSnippets,
} from '@/utils/pythonEditorAutocomplete';

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

const availableFuncs = [
  {
    name: 'yuze.get_var(name)',
    desc: '读取工作流变量，可传第二个参数作为默认值',
    example: "value = yuze.get_var('count', 0)",
  },
  {
    name: 'yuze.set_var(name, value)',
    desc: '写入工作流变量，块结束后回写引擎（值需可 JSON 序列化）',
    example: "yuze.set_var('tableText', 'a\\nb')",
  },
  {
    name: 'yuze.get_table()',
    desc: '读取表格，返回行对象列表（字典键 = 列名）',
    example:
      "rows = yuze.get_table()\ntext = '\\n'.join(r['orderdata'] for r in rows)\nyuze.set_var('tableText', text)",
  },
  {
    name: 'yuze.set_table(rows)',
    desc: '整体替换表格，rows 为行对象列表',
    example: "yuze.set_table([{'name': 'a'}, {'name': 'b'}])",
  },
  {
    name: 'yuze.add_row(row)',
    desc: '向表格末尾追加一行（字典）',
    example: "yuze.add_row({'name': '新行', '数量': 1})",
  },
  {
    name: 'yuze.next_block(data)',
    desc: '控制流向：data 传给下一个块的数据；insert=False 不写入表格',
    example: "yuze.next_block(data={'msg': 'ok'})",
  },
  {
    name: 'yuze.log(*parts)',
    desc: '写日志，在工作流日志中可见',
    example: "yuze.log('处理完成', len(rows))",
  },
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hoverDoc(func) {
  return `<div style="text-align:left"><p style="margin-bottom:4px">${escapeHtml(
    func.desc
  )}</p><pre style="white-space:pre-wrap;margin:0;padding:6px 8px;background:rgba(0,0,0,.35);border-radius:6px;font-size:12px">${escapeHtml(
    func.example
  )}</pre></div>`;
}

const state = reactive({
  activeTab: 'code',
  code: `${props.data.code}`,
  showCodeModal: false,
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

const codemirrorExts = [
  python(),
  autocompletion({
    override: [yuzeFuncsCompletion(yuzeFuncsSnippets)],
  }),
];

watch(
  () => state.code,
  (value) => {
    updateData({ code: value });
  }
);
</script>
<style scoped>
code {
  @apply bg-gray-900 text-sm text-white p-1 rounded-md;
}
</style>
