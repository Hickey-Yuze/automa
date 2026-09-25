/**
 * yuze JS API 的 background 端路由。
 * 通道：页面 CustomEvent(__yuze-call__) → content script → runtime 消息(yuze:call) → 此处
 * 安全边界：action 白名单路由，未注册的 action 一律拒绝。
 */
import browser from 'webextension-polyfill';
import { parseJSON } from '@/utils/helper';
import yuzeSource from '@/automation/python/yuzeSource';

const PY_BRIDGE_KEY = 'pythonBridgeConfig';
const PY_BRIDGE_DEFAULTS = { host: '127.0.0.1', port: 27182, token: '' };

/**
 * 在本机 Python 上执行代码（直连桥，不经消息代理——此处已在 background，
 * 可直接读 storage；bridgeClient 的版本走消息代理是为 offscreen 准备的）
 */
async function runPython({
  code,
  variables = {},
  table = [],
  timeoutMs = 30000,
}) {
  const { [PY_BRIDGE_KEY]: config } = await browser.storage.local.get(
    PY_BRIDGE_KEY
  );
  const { host, port, token } = { ...PY_BRIDGE_DEFAULTS, ...config };

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
        data: { variables, table },
      }),
      signal: controller.signal,
    });

    if (response.status === 401) throw new Error('bridge-auth');

    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(`bridge-exec-error:${payload.error || 'unknown'}`);
    }

    const result = parseJSON(payload.result, {});

    return {
      variables: result.variables || {},
      table: result.table || [],
      logs: result.logs || [],
      output: payload.output || '',
      durationMs: payload.durationMs || 0,
    };
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('bridge-timeout');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** action → handler；handler 收到已解析的 args，返回值原路回传页面 */
const handlers = {
  'tabs.list': async () => {
    const tabs = await browser.tabs.query({});
    return tabs.map(({ id, title, url, active, windowId, index }) => ({
      id,
      title,
      url,
      active,
      windowId,
      index,
    }));
  },
  'tabs.create': ({ url, active = true, index }) =>
    browser.tabs.create({ url, active, index }),
  'tabs.activate': (tabId) =>
    browser.tabs.update(Number(tabId), { active: true }),
  'tabs.close': (tabIds) =>
    browser.tabs.remove(
      Array.isArray(tabIds) ? tabIds.map(Number) : [Number(tabIds)]
    ),
  'tabs.update': ({ tabId, props }) =>
    browser.tabs.update(Number(tabId), props || {}),
  'storage.get': (key) => browser.storage.local.get(key),
  'storage.set': ({ key, value }) =>
    browser.storage.local.set({ [key]: value }),
  'storage.remove': (keys) =>
    browser.storage.local.remove(Array.isArray(keys) ? keys : [keys]),
  'downloads.download': ({ url, filename }) =>
    browser.downloads.download({ url, filename: filename || undefined }),
  'cookies.getAll': (filter) => browser.cookies.getAll(filter || {}),
  'python.run': runPython,
};

export function registerYuzeCallHandlers(message) {
  message.on('yuze:call', async ({ action, args }) => {
    const handler = handlers[action];
    if (!handler) throw new Error(`yuze: unknown action "${action}"`);

    return handler(args);
  });
}
