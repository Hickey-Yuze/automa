<template>
  <div class="space-y-2">
    <ui-input
      :model-value="data.time"
      :label="t('blocks.delay.input.title')"
      class="w-full"
      type="text"
      @change="updateData({ time: $event })"
    />
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
