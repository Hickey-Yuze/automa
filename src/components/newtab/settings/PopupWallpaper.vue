<template>
  <div id="popup-wallpaper" class="mt-12">
    <p class="mb-1 font-semibold">弹窗壁纸（工具栏弹窗背景）</p>
    <p class="mb-2 text-sm text-gray-600 dark:text-gray-200">
      选择本地图片作为 Automa
      弹窗背景，拖动滑杆调整显示区域（等效裁剪），预览即最终效果
    </p>
    <div class="flex items-start gap-6">
      <div
        class="relative h-80 w-56 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
      >
        <img
          v-if="wallpaper.image"
          :src="wallpaper.image"
          :style="previewStyle"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          v-if="wallpaper.image"
          class="absolute inset-0"
          :style="{ background: `rgba(0, 0, 0, ${wallpaper.dim})` }"
        ></div>
        <p
          v-if="!wallpaper.image"
          class="absolute inset-0 flex items-center justify-center text-sm text-gray-400"
        >
          暂无壁纸
        </p>
      </div>
      <div class="w-72 space-y-3">
        <ui-button block @click="fileInput.click()">选择图片</ui-button>
        <label v-for="slider in sliders" :key="slider.key" class="block">
          <span class="mb-1 block text-sm">
            {{ slider.label }}（{{ wallpaper[slider.key] }}{{ slider.unit }}）
          </span>
          <input
            v-model.number="wallpaper[slider.key]"
            type="range"
            :min="slider.min"
            :max="slider.max"
            :step="slider.step"
            class="w-full accent-green-600"
          />
        </label>
        <div class="flex gap-2">
          <ui-button variant="accent" class="flex-1" @click="saveWallpaper">
            保存
          </ui-button>
          <ui-button class="flex-1" @click="clearWallpaper">清除壁纸</ui-button>
        </div>
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import browser from 'webextension-polyfill';
import { useToast } from 'vue-toastification';

const STORAGE_KEY = 'popupWallpaper';
const toast = useToast();
const fileInput = ref(null);

const wallpaper = reactive({
  image: '',
  scale: 100,
  x: 50,
  y: 50,
  dim: 0.55,
});

const sliders = [
  { key: 'scale', label: '缩放', min: 100, max: 400, step: 5, unit: '%' },
  { key: 'x', label: '水平位置', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'y', label: '垂直位置', min: 0, max: 100, step: 1, unit: '%' },
  {
    key: 'dim',
    label: '背景暗化',
    min: 0,
    max: 0.85,
    step: 0.05,
    unit: '',
  },
];

const previewStyle = computed(() => ({
  objectPosition: `${wallpaper.x}% ${wallpaper.y}%`,
  transform: `scale(${wallpaper.scale / 100})`,
}));

function compressImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 720;
      const ratio = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function onFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const rawDataUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

  wallpaper.image = await compressImage(rawDataUrl);
  event.target.value = '';
}

async function saveWallpaper() {
  if (!wallpaper.image) {
    toast.error('请先选择图片');
    return;
  }
  await browser.storage.local.set({ [STORAGE_KEY]: { ...wallpaper } });
  toast('壁纸已保存，重新打开弹窗查看效果');
}

async function clearWallpaper() {
  await browser.storage.local.remove(STORAGE_KEY);
  Object.assign(wallpaper, { image: '', scale: 100, x: 50, y: 50, dim: 0.55 });
  toast('壁纸已清除');
}

onMounted(async () => {
  const result = await browser.storage.local.get(STORAGE_KEY);
  if (result[STORAGE_KEY]) {
    Object.assign(wallpaper, result[STORAGE_KEY]);
  }
});
</script>
