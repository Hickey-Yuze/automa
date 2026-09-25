// AI 问答块：调用 OpenAI 兼容接口（DeepSeek/OpenAI/硅基流动等）
// 提示词经 renderString 渲染（支持 {{variables@name}} 插值），回答写回工作流变量
import { chatCompletion, getAiChatConfig } from '@/automation/ai/aiChatClient';
import renderString from '../templating/renderString';

const ERROR_MESSAGES = {
  'ai-chat-not-configured':
    '未配置 AI 服务：打开 Automa 设置 →「AI 服务」，填写 API 地址、Key 和模型',
  'ai-chat-empty-prompt': '提示词为空：填写用户提示词后再运行',
  'ai-chat-empty-response': 'AI 服务返回内容为空，检查模型名是否正确',
};

const HTTP_PREFIX = 'ai-chat-http-';

function translateError(err) {
  const msg = err?.message || String(err);

  if (msg.startsWith(HTTP_PREFIX)) {
    const status = msg.slice(HTTP_PREFIX.length).split(':')[0];
    const hint = status === '401' ? 'API Key 无效' : '检查 API 地址与 Key';
    return `AI 服务请求失败（HTTP ${status}）：${hint}`;
  }
  if (err?.name === 'AbortError') {
    return 'AI 服务请求超时：可在本块的「超时时间」里调大毫秒数';
  }

  return ERROR_MESSAGES[msg] || msg;
}

export default async function ({ data, id }, { refData }) {
  const config = await getAiChatConfig();

  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new Error('ai-chat-not-configured');
  }

  const prompt = (
    await renderString(data.prompt || '', refData, this.engine.isPopup)
  ).value;
  if (!prompt || !prompt.trim()) {
    throw new Error('ai-chat-empty-prompt');
  }

  const system = (
    await renderString(
      data.system || '你是有用的助手，回答简洁准确。',
      refData,
      this.engine.isPopup
    )
  ).value;

  let answer;
  try {
    answer = await chatCompletion({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: data.model || config.model,
      system,
      prompt,
      temperature: data.temperature === 0 ? 0 : +data.temperature || 0.7,
      timeoutMs: Math.max(5000, +data.timeout || 60000),
    });
  } catch (err) {
    throw new Error(translateError(err));
  }

  const resultVar = (data.resultVar || 'aiAnswer').trim();
  await this.setVariable(resultVar, answer);

  return {
    data: answer,
    nextBlockId: this.getBlockConnections(id),
  };
}
