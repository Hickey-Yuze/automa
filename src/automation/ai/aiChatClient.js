// AI 问答块的服务客户端（OpenAI 兼容协议）
// 执行链运行在 offscreen document：chrome.storage 与跨域 fetch 均不可用，
// 配置读写与 API 调用一律经 runtime 消息代理到 background 执行
// （host_permissions: <all_urls> 豁免 CORS）。
import { sendMessage } from '@/utils/message';

const DEFAULT_CONFIG = { baseUrl: '', apiKey: '', model: '' };

export async function getAiChatConfig() {
  const config = await sendMessage('ai-chat:config-get', {}, 'background');
  return { ...DEFAULT_CONFIG, ...(config || {}) };
}

export async function setAiChatConfig(patch) {
  const config = await sendMessage('ai-chat:config-set', patch, 'background');
  return { ...DEFAULT_CONFIG, ...(config || {}) };
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
  const answer = await sendMessage(
    'ai-chat:completion',
    { baseUrl, apiKey, model, system, prompt, temperature, timeoutMs },
    'background'
  );

  if (typeof answer !== 'string') {
    throw new Error('ai-chat-empty-response');
  }

  return answer;
}
