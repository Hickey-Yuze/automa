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
            <code v-for="func in availableFuncs" :key="func">
              {{ func }}
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
  'yuze.get_var(name)',
  'yuze.set_var(name, value)',
  'yuze.get_table()',
  'yuze.set_table(rows)',
  'yuze.add_row(row)',
  'yuze.next_block(data)',
  'yuze.log(*parts)',
];

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
