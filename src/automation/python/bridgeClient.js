// 本机 Python 桥接客户端
// 协议：POST http://127.0.0.1:{port}/execute
//   headers: { 'Content-Type': 'application/json', 'X-Yuze-Token': <token> }
//   body:    { timeoutMs, prelude, code, data: { variables, table } }
//   响应:    { ok, result, output, error?, durationMs }
//   result 为 yuze._dump() 产出的 JSON 字符串，由调用方 parseJSON 还原。
import Browser from 'webextension-polyfill';
import { parseJSON } from '@/utils/helper';
import yuzeSource from './yuzeSource';

const DEFAULT_CONFIG = { host: '127.0.0.1', port: 27182, token: '' };
const CONFIG_KEY = 'pythonBridgeConfig';

export async function getBridgeConfig() {
  const { [CONFIG_KEY]: config } = await Browser.storage.local.get(CONFIG_KEY);
  return { ...DEFAULT_CONFIG, ...(config || {}) };
}

export async function setBridgeConfig(patch) {
  const current = await getBridgeConfig();
  const next = { ...current, ...patch };
  await Browser.storage.local.set({ [CONFIG_KEY]: next });
  return next;
}

/**
 * 在本机 Python 上执行代码
 * @returns {{ result: object, output: string, durationMs: number }}
 * @throws Error（message 为语义化错误码：bridge-no-token / bridge-unreachable /
 *                bridge-timeout / bridge-auth / bridge-exec-error:<msg>）
 */
export async function sendToBridge({ code, snapshot, timeoutMs = 30000 }) {
  const { host, port, token } = await getBridgeConfig();

  if (!token) throw new Error('bridge-no-token');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs + 5000);

  try {
    const response = await fetch(`http://${host}:${port}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Yuze-Token': token,
      },
      body: JSON.stringify({
        token,
        timeoutMs,
        prelude: yuzeSource,
        code,
        data: snapshot,
      }),
      signal: controller.signal,
    });

    if (response.status === 401) throw new Error('bridge-auth');

    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(`bridge-exec-error:${payload.error || 'unknown'}`);
    }

    return {
      result: parseJSON(payload.result, {}),
      output: payload.output || '',
      durationMs: payload.durationMs || 0,
      executedOn: 'bridge',
    };
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('bridge-timeout');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** 设置页「测试连接」用：探活桥接服务 */
export async function pingBridge() {
  const { host, port, token } = await getBridgeConfig();
  if (!token) throw new Error('bridge-no-token');

  const response = await fetch(`http://${host}:${port}/health`, {
    headers: { 'X-Yuze-Token': token },
  });
  if (response.status === 401) throw new Error('bridge-auth');

  const payload = await response.json();
  return payload; // { ok, python: "3.x.x" }
}
