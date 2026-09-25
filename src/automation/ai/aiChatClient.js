// AI 问答块的服务封装（OpenAI 兼容协议）
// 配置存于扩展本地存储（key: aiChatConfig），设置页「AI 服务」节维护；
// baseUrl/apiKey/model 全局共用，块级可覆盖 model。
// 协议：POST {baseUrl}/chat/completions，Bearer 鉴权，标准 messages 消息体。
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';

const STORAGE_KEY = 'aiChatConfig';
const DEFAULT_CONFIG = { baseUrl: '', apiKey: '', model: '' };

export async function getAiChatConfig() {
  const result = await BrowserAPIService.storage.local.get(STORAGE_KEY);
  return { ...DEFAULT_CONFIG, ...(result[STORAGE_KEY] || {}) };
}

export async function setAiChatConfig(patch) {
  const current = await getAiChatConfig();
  const next = { ...current, ...patch };
  await BrowserAPIService.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

export async function chatCompletion({
  baseUrl,
  apiKey,
  model,
  system,
  prompt,
  temperature = 0.7,
  timeoutMs = 60000,
}) {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
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
      const err = new Error(
        `ai-chat-http-${response.status}: ${text.slice(0, 200)}`
      );
      throw err;
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
