<template>
  <ui-modal :model-value="open" title="回收站" @close="emit('close')">
    <div class="mb-3 flex items-center">
      <p class="flex-1 text-sm text-gray-600 dark:text-gray-200">
        删除的工作流保留 30 天，最多 50 条
      </p>
      <ui-button v-if="items.length" variant="danger" small @click="clearAll">
        清空回收站
      </ui-button>
    </div>
    <div v-if="items.length" class="space-y-2">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center rounded-lg border border-gray-200 p-3 dark:border-gray-700"
      >
        <div class="flex-1 overflow-hidden">
          <p class="text-overflow font-semibold">{{ item.name }}</p>
          <p class="text-sm text-gray-600 dark:text-gray-200">
            删除于 {{ dayjs(item.deletedAt).format('YYYY-MM-DD HH:mm') }}
          </p>
        </div>
        <ui-button class="ml-3" small @click="restore(item)">
          <v-remixicon name="riArrowGoBackLine" class="mr-1 -ml-1" />
          还原
        </ui-button>
        <ui-button
          variant="danger"
          small
          class="ml-2"
          @click="removeForever(item)"
        >
          <v-remixicon name="riDeleteBin7Line" class="mr-1 -ml-1" />
          彻底删除
        </ui-button>
      </div>
    </div>
    <p v-else class="py-8 text-center text-gray-500">回收站是空的</p>
  </ui-modal>
</template>
<script setup>
import { ref, watch } from 'vue';
import dayjs from 'dayjs';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { useWorkflowStore } from '@/stores/workflow';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['close']);

const toast = useToast();
const workflowStore = useWorkflowStore();
const items = ref([]);

watch(
  () => props.open,
  async (show) => {
    if (show) items.value = await workflowStore.getRecycleBin();
  }
);

async function restore(item) {
  const restored = await workflowStore.restoreFromBin(item.id);
  items.value = await workflowStore.getRecycleBin();

  if (restored) {
    toast(`「${item.name}」已还原`);
  } else {
    toast.error('还原失败，条目可能已不存在');
  }
}

async function removeForever(item) {
  await workflowStore.removeFromBin(item.id);
  items.value = await workflowStore.getRecycleBin();
}

async function clearAll() {
  await browser.storage.local.set({ workflowRecycleBin: [] });
  items.value = [];
  toast('回收站已清空');
}
</script>
