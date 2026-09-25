<template>
  <div class="mb-12">
    <p class="mb-1 font-semibold">{{ t('settings.theme') }}</p>
    <div class="flex items-center space-x-4">
      <div
        v-for="item in theme.themes"
        :key="item.id"
        class="cursor-pointer"
        role="button"
        @click="theme.set(item.id)"
      >
        <div
          :class="{ 'ring ring-accent': item.id === theme.activeTheme.value }"
          class="rounded-lg p-0.5"
        >
          <img
            :src="require(`@/assets/images/theme-${item.id}.png`)"
            width="140"
            class="rounded-lg"
          />
        </div>
        <span class="ml-1 text-sm text-gray-600 dark:text-gray-200">
          {{ item.name }}
        </span>
      </div>
    </div>
  </div>
  <div class="flex items-center">
    <div id="languages">
      <p class="mb-1 font-semibold">{{ t('settings.language.label') }}</p>
      <ui-select
        :model-value="settings.locale"
        class="w-80"
        @change="updateLanguage"
      >
        <option
          v-for="locale in supportLocales"
          :key="locale.id"
          :value="locale.id"
        >
          {{ locale.name }}
        </option>
      </ui-select>
      <a
        class="ml-1 block text-gray-600 dark:text-gray-200"
        href="https://github.com/AutomaApp/automa/wiki/Help-Translate"
        target="_blank"
        rel="noopener"
      >
        {{ t('settings.language.helpTranslate') }}
      </a>
    </div>
    <p v-if="isLangChange" class="ml-4 inline-block">
      {{ t('settings.language.reloadPage') }}
    </p>
  </div>
  <div id="delete-logs" class="mt-12">
    <p class="mb-1 font-semibold">Workflow Logs</p>
    <div class="flex items-center">
      <ui-select
        :model-value="settings.deleteLogAfter"
        :label="t('settings.deleteLog.title')"
        placeholder="Delete after"
        class="w-80"
        @change="
          updateSetting(
            'deleteLogAfter',
            $event === 'never' ? 'never' : +$event
          )
        "
      >
        <option v-for="day in deleteLogDays" :key="day" :value="day">
          <template v-if="typeof day === 'string'">
            {{ t('settings.deleteLog.deleteAfter.never') }}
          </template>
          <template v-else>
            {{ t('settings.deleteLog.deleteAfter.days', { day }) }}
          </template>
        </option>
      </ui-select>
      <ui-input
        :model-value="settings.logsLimit"
        class="ml-4"
        type="number"
        label="Logs limit"
        min="10"
        @change="updateSetting('logsLimit', +$event <= 0 ? 1000 : +$event)"
      />
    </div>
  </div>
  <div id="python-bridge" class="mt-12">
    <p class="mb-1 font-semibold">Python 桥接（本机执行 Python 代码块）</p>
    <p class="mb-2 text-sm text-gray-600 dark:text-gray-200">
      先在本机启动桥接服务：<code>python3 automa-bridge/server.py</code>， token
      自动生成于 <code>~/.automa-bridge/token</code>，把文件内容粘贴到下面。
    </p>
    <div class="flex items-start">
      <div class="w-80 space-y-2">
        <ui-input
          :model-value="bridgeConfig.token"
          type="password"
          label="Token"
          placeholder="粘贴 ~/.automa-bridge/token 的内容"
          @change="updateBridgeConfig({ token: $event.trim() })"
        />
        <ui-input
          :model-value="bridgeConfig.port"
          type="number"
          label="端口（默认 27182）"
          @change="updateBridgeConfig({ port: +$event || 27182 })"
        />
      </div>
      <div class="ml-4">
        <ui-button
          variant="accent"
          :disabled="state.pinging"
          @click="pingBridgeAction"
        >
          {{ state.pinging ? '测试中...' : '测试连接' }}
        </ui-button>
        <p v-if="state.pingResult" class="mt-2 text-sm">
          {{ state.pingResult }}
        </p>
      </div>
    </div>
  </div>
  <div id="ai-chat" class="mt-12">
    <p class="mb-1 font-semibold">
      AI 服务（OpenAI 兼容，供「AI 问答」块使用）
    </p>
    <p class="mb-2 text-sm text-gray-600 dark:text-gray-200">
      填任意 OpenAI 兼容服务，例如
      DeepSeek：<code>https://api.deepseek.com</code>、模型
      <code>deepseek-chat</code>；OpenAI 官方填
      <code>https://api.openai.com/v1</code>
    </p>
    <div class="w-80 space-y-2">
      <ui-input
        :model-value="aiChatConfig.baseUrl"
        label="API 地址（不含 /chat/completions）"
        placeholder="https://api.deepseek.com"
        @change="
          updateAiChatConfig({ baseUrl: $event.trim().replace(/\/+$/, '') })
        "
      />
      <ui-input
        :model-value="aiChatConfig.apiKey"
        type="password"
        label="API Key"
        placeholder="sk-..."
        @change="updateAiChatConfig({ apiKey: $event.trim() })"
      />
      <ui-input
        :model-value="aiChatConfig.model"
        label="默认模型"
        placeholder="deepseek-chat"
        @change="updateAiChatConfig({ model: $event.trim() })"
      />
    </div>
  </div>
</template>
<script setup>
import { computed, reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useStore } from '@/stores/main';
import { useTheme } from '@/composable/theme';
import { supportLocales } from '@/utils/shared';
import {
  getBridgeConfig,
  setBridgeConfig,
  pingBridge,
} from '@/automation/python/bridgeClient';
import { getAiChatConfig, setAiChatConfig } from '@/automation/ai/aiChatClient';

const deleteLogDays = ['never', 7, 14, 30, 60, 120];

const { t } = useI18n();
const toast = useToast();
const store = useStore();
const theme = useTheme();

const isLangChange = ref(false);
const settings = computed(() => store.settings);

const bridgeConfig = ref({ token: '', port: 27182 });
const aiChatConfig = ref({ baseUrl: '', apiKey: '', model: '' });
const state = reactive({ pinging: false, pingResult: '' });

onMounted(async () => {
  bridgeConfig.value = await getBridgeConfig();
  aiChatConfig.value = await getAiChatConfig();
});

async function updateAiChatConfig(patch) {
  aiChatConfig.value = await setAiChatConfig(patch);
}

async function updateBridgeConfig(patch) {
  bridgeConfig.value = await setBridgeConfig(patch);
}

async function pingBridgeAction() {
  state.pinging = true;
  state.pingResult = '';

  try {
    const result = await pingBridge();
    state.pingResult = `✅ 连接成功，本机 Python ${result.python}`;
    toast.success(state.pingResult);
  } catch (err) {
    const messages = {
      'bridge-no-token': '❌ 未填写 token',
      'bridge-auth':
        '❌ token 校验失败，请检查与 ~/.automa-bridge/token 是否一致',
    };
    const msg =
      messages[err?.message] || '❌ 连接失败：桥接服务未启动或端口不对';
    state.pingResult = msg;
    toast.error(msg);
  } finally {
    state.pinging = false;
  }
}

function updateSetting(path, value) {
  store.updateSettings({ [path]: value });
}
function updateLanguage(value) {
  isLangChange.value = true;

  updateSetting('locale', value);
}
</script>
