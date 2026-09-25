<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="mb-2 w-full"
      @change="updateData({ description: $event })"
    />
    <ui-textarea
      :model-value="data.system"
      :label="t('workflow.blocks.ai-chat.system')"
      :placeholder="t('workflow.blocks.ai-chat.systemPlaceholder')"
      class="mb-2 w-full"
      @change="updateData({ system: $event })"
    />
    <label class="input-label" for="ai-chat-prompt">
      {{ t('workflow.blocks.ai-chat.prompt') }}
    </label>
    <ui-textarea
      id="ai-chat-prompt"
      :model-value="data.prompt"
      :placeholder="t('workflow.blocks.ai-chat.promptPlaceholder')"
      class="mb-2 w-full"
      @change="updateData({ prompt: $event })"
    />
    <ui-input
      :model-value="data.resultVar"
      :label="t('workflow.blocks.ai-chat.resultVar')"
      placeholder="aiAnswer"
      class="mb-2 w-full"
      @change="updateData({ resultVar: $event.trim() })"
    />
    <ui-input
      :model-value="data.model"
      :label="t('workflow.blocks.ai-chat.model')"
      :placeholder="t('workflow.blocks.ai-chat.modelPlaceholder')"
      class="mb-2 w-full"
      @change="updateData({ model: $event.trim() })"
    />
    <ui-input
      :model-value="data.timeout"
      type="number"
      :label="t('workflow.blocks.ai-chat.timeout')"
      class="w-full"
      @change="updateData({ timeout: +$event || 60000 })"
    />
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
