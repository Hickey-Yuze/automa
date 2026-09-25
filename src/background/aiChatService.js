// AI 问答块的后台代理：配置读写（chrome.storage）与 OpenAI 兼容调用（fetch）
// background 的 service worker 拥有 storage 与 host_permissions(<all_urls>)，
// 由 offscreen 的 aiChatClient 经 runtime 消息调用
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';

const STORAGE_KEY = 'aiChatConfig';
const DEFAULT_CONFIG = { baseUrl: '', apiKey: '', model: '' };

async function configGet() {
  const result = await BrowserAPIService.storage.local.get(STORAGE_KEY);
  return { ...DEFAULT_CONFIG, ...(result[STORAGE_KEY] || {}) };
}

async function configSet(patch) {
  const current = await configGet();
  const next = { ...current, ...patch };
  await BrowserAPIService.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

async function completion({
  baseUrl,
  apiKey,
  model,
  system,
  prompt,
  temperature = 0.7,
  timeoutMs = 60000,
}) {
  const url = `${String(baseUrl).replace(/\/+$/, '')}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`ai-chat-http-${response.status}: ${text.slice(0, 200)}`);
    }

    const result = await response.json();
    const answer = result?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string') {
      throw new Error('ai-chat-empty-response');
    }

    return answer;
  } finally {
    clearTimeout(timer);
  }
}

export function registerAiChatHandlers(message) {
  message.on('ai-chat:config-get', async () => configGet());
  message.on('ai-chat:config-set', async (patch) => configSet(patch));
  message.on('ai-chat:completion', async (params) => completion(params));
}
