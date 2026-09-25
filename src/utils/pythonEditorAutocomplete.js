/* eslint-disable no-template-curly-in-string */
// Python 块编辑器补全：yuze 内置 API（中文文档）
import { snippet } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

const dontCompleteIn = ['Comment', 'String', 'FormatString'];

function doc(code, desc) {
  const container = document.createElement('div');
  container.innerHTML = `
    <code>${code}</code>
    <p class="mt-2">${desc}</p>
  `;

  return container;
}

export const yuzeFuncsSnippets = [
  {
    label: 'yuze.get_var',
    type: 'function',
    apply: snippet("yuze.get_var('${name}')"),
    info: () =>
      doc(
        'yuze.get_var(<i>name</i>, <i>default=None</i>)',
        '读取 Automa 工作流变量，不存在时返回 default'
      ),
  },
  {
    label: 'yuze.set_var',
    type: 'function',
    apply: snippet("yuze.set_var('${name}', ${value})"),
    info: () =>
      doc(
        'yuze.set_var(<i>name</i>, <i>value</i>)',
        '写入工作流变量，块执行结束后回写（值需可 JSON 序列化）'
      ),
  },
  {
    label: 'yuze.get_table',
    type: 'function',
    apply: 'yuze.get_table()',
    info: () =>
      doc('yuze.get_table()', '读取表格，返回行对象列表（字典键 = 列名）'),
  },
  {
    label: 'yuze.set_table',
    type: 'function',
    apply: 'yuze.set_table(${rows})',
    info: () =>
      doc(
        'yuze.set_table(<i>rows</i>)',
        '整体替换表格，rows 为行对象列表（字典键 = 列名）'
      ),
  },
  {
    label: 'yuze.add_row',
    type: 'function',
    apply: 'yuze.add_row(${row})',
    info: () => doc('yuze.add_row(<i>row</i>)', '向表格末尾追加一行（字典）'),
  },
  {
    label: 'yuze.get_loop_data',
    type: 'function',
    apply: 'yuze.get_loop_data(${loop_id})',
    info: () =>
      doc(
        'yuze.get_loop_data(<i>loop_id=None</i>)',
        '读取循环上下文的当前项（在「循环数据」块内使用）；无循环返回 None，多个循环需传 loop_id'
      ),
  },
  {
    label: 'yuze.get_loop_index',
    type: 'function',
    apply: 'yuze.get_loop_index(${loop_id})',
    info: () =>
      doc(
        'yuze.get_loop_index(<i>loop_id=None</i>)',
        '读取循环当前索引（从 0 开始）；无循环返回 None，多个循环需传 loop_id'
      ),
  },
  {
    label: 'yuze.next_block',
    type: 'function',
    apply: 'yuze.next_block(data=${data})',
    info: () =>
      doc(
        'yuze.next_block(<i>data=None</i>, <i>insert=True</i>, <i>block_id=None</i>)',
        '控制流向：data 是传给下一个块的数据；insert=False 不写入表格；block_id 可指定下一块'
      ),
  },
  {
    label: 'yuze.log',
    type: 'function',
    apply: "yuze.log('${message}')",
    info: () => doc('yuze.log(<i>*parts</i>)', '写日志，在工作流日志中可见'),
  },
];

export function yuzeFuncsCompletion(options) {
  return function (context) {
    const word = context.matchBefore(/[\w.]*/);
    const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

    if (
      (word.from === word.to && !context.explicit) ||
      dontCompleteIn.includes(nodeBefore.name)
    )
      return null;

    return {
      from: word.from,
      options,
      validFor: /^[\w.]*$/,
    };
  };
}
