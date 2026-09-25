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

/** 悬停 automa* 函数名时展示中文文档的 CodeMirror 扩展 */
export const automaHover = hoverTooltip((view, pos) => {
  const word = view.state.wordAt(pos);
  if (!word) return null;

  const name = view.state.sliceDoc(word.from, word.to);
  const doc = apiByName.get(name);
  if (!doc) return null;

  return {
    pos: word.from,
    end: word.to,
    above: true,
    create() {
      return { dom: renderApiDoc(doc) };
    },
  };
});
