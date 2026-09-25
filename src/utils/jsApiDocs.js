/**
 * Automa JS 块 API 中文文档单一真源。
 * 所有内容以源码为准：
 * - JS 代码块 API 集：src/workflowEngine/blocksHandler/handlerJavascriptCode.js (getAutomaScript)
 * - 注入 JavaScript 块 API 集：src/workflowEngine/blocksHandler/handlerCreateElement.js (getAutomaScript)
 * - automaFetch 代理实现：src/background/index.js (message.on('fetch'))
 * - automaExecWorkflow 监听方：src/content/services/shortcutListener.js
 */

import { hoverTooltip } from '@codemirror/view';

export const uiLabels = {
  params: '参数',
  returns: '返回值',
  example: '示例',
  ctxJsBlock: 'JS 代码块可用',
  ctxJsBlockEveryNewTab: '勾选「每个新标签页执行」时仅此函数可用',
  ctxInjectBlock: '仅「注入 JavaScript」块可用',
  insert: '插入示例',
  viewOnline: '查看在线文档',
};

export const jsApiDocs = [
  {
    name: 'automaRefData',
    signature: 'automaRefData(keyword, path?)',
    desc: '读取工作流运行数据（变量、表格、循环数据等），按点分路径取值。',
    params: [
      {
        name: 'keyword',
        type: 'string',
        desc: '数据源：variables、table、loopData 等',
      },
      {
        name: 'path',
        type: 'string',
        desc: '可选，点分路径，如 myVar.name；数组可用 $last 取最后一项',
      },
    ],
    returns: '对应数据；取不到时返回 undefined',
    example: "const name = automaRefData('variables', 'username');",
    contexts: ['js-block', 'every-new-tab', 'inject-block'],
    anchor: 'automarefdata-keyword-path',
  },
  {
    name: 'automaSetVariable',
    signature: 'automaSetVariable(name, value)',
    desc: '设置工作流变量的值，后续模块可通过该变量名读取。',
    params: [
      { name: 'name', type: 'string', desc: '变量名' },
      { name: 'value', type: 'any', desc: '要写入的值' },
    ],
    returns: '无',
    example: "automaSetVariable('count', 42);",
    contexts: ['js-block', 'inject-block'],
    anchor: 'automasetvariable-name-value',
  },
  {
    name: 'automaNextBlock',
    signature: 'automaNextBlock(data, insert?)',
    desc: '立即结束本模块并把 data 作为输出传给下一个模块。注意：即使不调用，代码执行完后也会自动以空数据结束。',
    params: [
      { name: 'data', type: 'any', desc: '传给下一个模块的数据' },
      {
        name: 'insert',
        type: 'boolean',
        desc: '可选，默认 true；为 false 时数据不插入表格',
      },
    ],
    returns: '无',
    example: "automaNextBlock({ title: 'hello' });",
    contexts: ['js-block'],
    anchor: 'automanextblock-data',
  },
  {
    name: 'automaFetch',
    signature: 'automaFetch(type, resource)',
    desc: '经扩展代理的网络请求，不受目标页面的 CORS 限制。响应非 2xx 时会抛出错误。',
    params: [
      {
        name: 'type',
        type: 'string',
        desc: "响应解析方式：'text' | 'json' | 'base64'",
      },
      {
        name: 'resource',
        type: 'object',
        desc: '标准 fetch 参数对象，必含 url，可带 method、headers、body 等',
      },
    ],
    returns: 'Promise<any>：按 type 解析后的响应内容',
    example:
      "const res = await automaFetch('json', {\n  url: 'https://api.example.com/data',\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ q: 'test' }),\n});",
    contexts: ['js-block'],
    anchor: 'automasetvariable-type-resource',
  },
  {
    name: 'automaResetTimeout',
    signature: 'automaResetTimeout()',
    desc: '重置本模块的超时计时器（超时上限由模块设置里的 timeout 决定）。适合轮询等待等耗时逻辑，防止执行中途被超时打断。',
    params: [],
    returns: '无',
    example: 'setInterval(() => {\n  automaResetTimeout();\n}, 5000);',
    contexts: ['js-block'],
    anchor: 'automaresettimeout',
  },
  {
    name: 'automaExecWorkflow',
    signature: 'automaExecWorkflow(options)',
    desc: '异步执行指定的工作流（不等待其完成）。注意：此函数在「JS 代码块」中不可用，只能在「注入 JavaScript」块中使用。',
    params: [
      {
        name: 'options',
        type: 'object',
        desc: '{ id 或 publicId: 工作流 ID；data?: 传给触发器的参数 }',
      },
    ],
    returns: '无（异步触发）',
    example:
      "automaExecWorkflow({ id: '你的工作流ID', data: { from: 'inject' } });",
    contexts: ['inject-block'],
    anchor: '',
  },
  {
    name: 'yuze.tabs.list',
    signature: 'yuze.tabs.list()',
    desc: '列出当前浏览器所有标签页。',
    params: [],
    returns: 'Promise<Array<{ id, title, url, active, windowId, index }>>',
    example:
      'const tabs = await yuze.tabs.list();\nconsole.log(tabs.map((t) => t.title));',
    contexts: ['js-block'],
    anchor: '',
  },
  {
    name: 'yuze.tabs.create',
    signature: 'yuze.tabs.create(url, opts?)',
    desc: '新建标签页并打开指定地址。',
    params: [
      { name: 'url', type: 'string', desc: '要打开的地址' },
      { name: 'opts', type: 'object', desc: '可选，{ active?: 是否前台打开 }' },
    ],
    returns: 'Promise<Tab>：新建的标签页信息',
    example: "await yuze.tabs.create('https://example.com');",
    contexts: ['js-block'],
    anchor: '',
  },
  {
    name: 'yuze.tabs.activate',
    signature: 'yuze.tabs.activate(tabId)',
    desc: '把指定标签页切到前台。',
    params: [
      {
        name: 'tabId',
        type: 'number',
        desc: '标签页 ID（可从 yuze.tabs.list() 获得）',
      },
    ],
    returns: 'Promise<void>',
    example: 'await yuze.tabs.activate(12345);',
    contexts: ['js-block'],
    anchor: '',
  },
  {
    name: 'yuze.tabs.close',
    signature: 'yuze.tabs.close(tabIds)',
    desc: '关闭指定标签页，可传单个 ID 或 ID 数组。',
    params: [
      {
        name: 'tabIds',
        type: 'number | number[]',
        desc: '标签页 ID 或 ID 数组',
      },
    ],
    returns: 'Promise<void>',
    example:
      'const tabs = await yuze.tabs.list();\nawait yuze.tabs.close(tabs.filter((t) => t.url.includes("example.com")).map((t) => t.id));',
    contexts: ['js-block'],
    anchor: '',
  },
  {
    name: 'yuze.tabs.update',
    signature: 'yuze.tabs.update(tabId, props)',
    desc: '更新标签页属性：跳转地址、静音、固定等。',
    params: [
      { name: 'tabId', type: 'number', desc: '标签页 ID' },
      {
        name: 'props',
        type: 'object',
        desc: '要修改的属性：{ url, active, muted, pinned } 等',
      },
    ],
    returns: 'Promise<Tab>',
    example:
      "await yuze.tabs.update(12345, { url: 'https://example.com/other' });",
    contexts: ['js-block'],
    anchor: '',
  },
  {
    name: 'yuze.ext.storage.get',
    signature: 'yuze.ext.storage.get(key)',
    desc: '读取扩展本地存储（chrome.storage.local），跨工作流、跨会话持久化，适合存配置和状态。',
    params: [
      {
        name: 'key',
        type: 'string | string[]',
        desc: '键名；传数组可一次取多个',
      },
    ],
    returns: 'Promise<Object>：{ 键名: 值 } 形式',
    example:
      "const data = await yuze.ext.storage.get('myConfig');\nconsole.log(data.myConfig);",
    contexts: ['js-block'],
    anchor: '',
  },
  {
    name: 'yuze.ext.storage.set',
    signature: 'yuze.ext.storage.set(key, value)',
    desc: '写入扩展本地存储，值须可 JSON 序列化。',
    params: [
      { name: 'key', type: 'string', desc: '键名' },
      { name: 'value', type: 'any', desc: '任意可序列化值' },
    ],
    returns: 'Promise<void>',
    example:
      "await yuze.ext.storage.set('lastRun', { at: Date.now(), count: 3 });",
    contexts: ['js-block'],
    anchor: '',
  },
  {
    name: 'yuze.ext.downloads.download',
    signature: 'yuze.ext.downloads.download(url, filename?)',
    desc: '用浏览器下载能力保存文件（走 chrome.downloads，支持 data: 与 blob: 地址）。',
    params: [
      { name: 'url', type: 'string', desc: '文件地址' },
      {
        name: 'filename',
        type: 'string',
        desc: '可选，相对下载目录的保存路径',
      },
    ],
    returns: 'Promise<number>：下载任务 ID',
    example:
      "await yuze.ext.downloads.download('https://example.com/report.csv', 'report.csv');",
    contexts: ['js-block'],
    anchor: '',
  },
  {
    name: 'yuze.ext.cookies.getAll',
    signature: 'yuze.ext.cookies.getAll(filter)',
    desc: '读取 cookies（chrome.cookies 语义），可按域名/名称过滤。',
    params: [
      {
        name: 'filter',
        type: 'object',
        desc: '如 { domain: "example.com", name: "session" }',
      },
    ],
    returns: 'Promise<Array<Cookie>>',
    example:
      "const cookies = await yuze.ext.cookies.getAll({ domain: 'example.com' });",
    contexts: ['js-block'],
    anchor: '',
  },
  {
    name: 'yuze.python',
    signature: 'yuze.python(code, vars?)',
    desc: '在本机 Python（yuze 桥）上同步执行代码并拿回结果。Python 代码里用 set_var 写入的变量会出现在返回的 variables 中；桥未启动或 token 未配置时抛错。仅 JS 代码块可用（everyNewTab 模式除外）。',
    params: [
      { name: 'code', type: 'string', desc: '要执行的 Python 代码' },
      {
        name: 'vars',
        type: 'object',
        desc: '可选，注入 Python 的变量（Python 里用 get_var 读取）',
      },
    ],
    returns: 'Promise<{ variables, table, logs, output, durationMs }>',
    example:
      "const res = await yuze.python(\"import json\\nset_var('sum', 1 + 2)\", { source: 'js' });\nconsole.log(res.variables.sum); // 3",
    contexts: ['js-block'],
    anchor: '',
  },
];

export const contextLabels = {
  'js-block': uiLabels.ctxJsBlock,
  'every-new-tab': uiLabels.ctxJsBlockEveryNewTab,
  'inject-block': uiLabels.ctxInjectBlock,
};

/** 转义 HTML 特殊字符 */ function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 渲染单条 API 的中文文档 DOM */
export function renderApiDoc(doc) {
  const container = document.createElement('div');
  const parts = [];

  parts.push(
    `<div style="font-weight:600;margin-bottom:6px"><code style="color:#82aaff">${esc(
      doc.signature
    )}</code></div>`
  );
  parts.push(`<p style="margin:0 0 6px">${esc(doc.desc)}</p>`);

  if (doc.params.length > 0) {
    const rows = doc.params
      .map(
        ({ name, type, desc }) =>
          `<tr><td style="padding:2px 8px 2px 0;white-space:nowrap"><code>${esc(
            name
          )}</code></td><td style="padding:2px 8px;color:#9ca3af;white-space:nowrap">${esc(
            type
          )}</td><td style="padding:2px 0">${esc(desc)}</td></tr>`
      )
      .join('');
    parts.push(
      `<div style="margin:0 0 6px"><b>${esc(
        uiLabels.params
      )}</b><table style="margin-top:4px">${rows}</table></div>`
    );
  }

  parts.push(
    `<p style="margin:0 0 6px"><b>${esc(uiLabels.returns)}</b>：${esc(
      doc.returns
    )}</p>`
  );
  parts.push(
    `<pre style="margin:0 0 6px;padding:6px 8px;background:#0d1117;border-radius:6px;overflow:auto;white-space:pre"><code>${esc(
      doc.example
    )}</code></pre>`
  );

  const ctx = doc.contexts
    .map((item) => contextLabels[item])
    .filter(Boolean)
    .join('；');
  if (ctx) {
    parts.push(
      `<p style="margin:0;color:#9ca3af;font-size:12px">${esc(ctx)}</p>`
    );
  }

  container.style.cssText =
    'max-width:420px;font-size:13px;line-height:1.6;padding:10px 12px;text-align:left';
  container.innerHTML = parts.join('');

  return container;
}

/** 生成补全选项（label/snippet 保持与上游一致的行为，info 换成中文文档） */
export function buildCompletionOptions(docs) {
  return docs.map((doc) => ({
    label: doc.name,
    type: 'function',
    apply: doc.name,
    detail: doc.signature,
    info: () => renderApiDoc(doc),
  }));
}

const apiByName = new Map(jsApiDocs.map((doc) => [doc.name, doc]));

/** 悬停 automa* 函数名与 yuze.* 链式调用时展示中文文档的 CodeMirror 扩展 */
export const automaHover = hoverTooltip((view, pos) => {
  const line = view.state.doc.lineAt(pos);
  const before = view.state.sliceDoc(line.from, pos);
  // 优先匹配链式名（yuze.tabs.list），回退到单个标识符（automaNextBlock）
  const chain = before.match(/(?:[\w$]+\.)+[\w$]*$/);
  const word = chain ? null : view.state.wordAt(pos);

  let name = null;
  if (chain) {
    [name] = chain;
  } else if (word) {
    name = view.state.sliceDoc(word.from, word.to);
  }
  if (!name) return null;

  const doc = apiByName.get(name);
  if (!doc) return null;

  const from = chain ? pos - name.length : word.from;
  const end = chain ? pos : word.to;

  return {
    pos: from,
    end,
    above: true,
    create() {
      return { dom: renderApiDoc(doc) };
    },
  };
});
