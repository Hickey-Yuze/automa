// Python 代码块执行链
// 通道调度：auto（先本机桥接，失败自动降级浏览器内 Pyodide）/ bridge / pyodide
// 数据交换：快照式——执行前注入 {variables, table}，执行后按 yuze._dump() 回传差异
import { isObject } from '@/utils/helper';
import cloneDeep from 'lodash.clonedeep';
import { sendToBridge } from '@/automation/python/bridgeClient';
import { runPyodide } from '@/automation/python/pyodideClient';

const ERROR_MESSAGES = {
  'bridge-no-token':
    '未配置桥接 token：打开 Automa 设置 →「Python 桥接」，填入 ~/.automa-bridge/token 文件中的令牌',
  'bridge-unreachable':
    '本机桥接服务不可达：请先启动桥接（python3 automa-bridge/server.py），或把「运行通道」改为「自动」以降级到浏览器内 Python',
  'bridge-timeout': '桥接执行超时：可在本块的「超时时间」里调大毫秒数',
  'bridge-auth':
    '桥接 token 校验失败：检查扩展设置里的 token 与 ~/.automa-bridge/token 是否一致',
  'pyodide-not-ready': '浏览器内 Python（Pyodide）尚未启用，请改用本机桥接通道',
};

function translateError(err) {
  const msg = err?.message || String(err);
  const prefix = 'bridge-exec-error:';

  if (msg.startsWith(prefix)) {
    return `Python 执行出错：${msg.slice(prefix.length)}`;
  }

  return ERROR_MESSAGES[msg] || msg;
}

const FALLBACK_CODES = [
  'bridge-unreachable',
  'bridge-timeout',
  'bridge-no-token',
  'bridge-auth',
];

async function executeChannel(channel, { code, snapshot, timeoutMs }) {
  if (channel === 'pyodide') {
    return runPyodide({ code, snapshot, timeoutMs });
  }

  try {
    return await sendToBridge({ code, snapshot, timeoutMs });
  } catch (err) {
    const isFallbackable = FALLBACK_CODES.includes(err?.message);
    if (channel === 'auto' && isFallbackable) {
      console.warn(
        `[python-code] 桥接不可用（${err.message}），降级到 Pyodide`
      );
      const fallback = await runPyodide({ code, snapshot, timeoutMs });
      fallback.fellBackFrom = err.message;

      return fallback;
    }

    throw err;
  }
}

export async function pythonCode({ data, ...block }, { refData }) {
  let nextBlockId = this.getBlockConnections(block.id);
  const timeoutMs = Math.max(1000, +data.timeout || 30000);
  const channel = data.channel || 'auto';

  const prevVariables = isObject(refData.variables) ? refData.variables : {};
  const snapshot = {
    variables: cloneDeep(prevVariables),
    table: cloneDeep(this.engine.referenceData.table || []),
    loopData: cloneDeep(refData.loopData || {}),
  };

  let executed;
  try {
    executed = await executeChannel(channel, {
      code: data.code,
      snapshot,
      timeoutMs,
    });
  } catch (err) {
    throw new Error(translateError(err));
  }

  const result = isObject(executed.result) ? executed.result : {};
  const logs = Array.isArray(result.logs) ? result.logs : [];
  const newVariables = isObject(result.variables) ? result.variables : {};
  const newTable = Array.isArray(result.table) ? result.table : [];
  const next = isObject(result.next) ? result.next : null;

  console.log(
    `[python-code] 通道: ${
      executed.fellBackFrom
        ? `pyodide(降级自 ${executed.fellBackFrom})`
        : executed.executedOn || channel
    }${executed.durationMs ? ` | 耗时 ${executed.durationMs}ms` : ''}`
  );

  // 回写变量：仅回写发生变化的
  await Promise.allSettled(
    Object.keys(newVariables)
      .filter((name) => newVariables[name] !== prevVariables[name])
      .map(async (name) => {
        await this.setVariable(name, newVariables[name]);
      })
  );

  // 回写表格：整体发生变化才替换（行对象键 = 列名）
  const tableChanged =
    JSON.stringify(newTable) !== JSON.stringify(snapshot.table);
  if (tableChanged) {
    this.engine.referenceData.table = newTable.map((row) =>
      isObject(row) ? row : { value: row }
    );
    Object.keys(this.engine.columns).forEach((key) => {
      this.engine.columns[key].index = 0;
    });
  }

  // yuze.log 输出到工作流日志
  if (logs.length) {
    this.engine.addLogHistory({
      type: 'success',
      name: block.label,
      description: `[yuze.log] ${logs.join(' | ')}`,
      blockId: block.id,
      workerId: this.id,
      timestamp: Date.now(),
    });
  }

  // stdout（print）输出到工作流日志——原版命令行脚本直接粘贴也能看到输出
  const stdout =
    typeof executed.output === 'string' ? executed.output.trim() : '';
  if (stdout) {
    this.engine.addLogHistory({
      type: 'success',
      name: block.label,
      description: `[print] ${stdout.slice(0, 500)}`,
      blockId: block.id,
      workerId: this.id,
      timestamp: Date.now(),
    });
  }

  // 流向控制（对齐 javascriptCode 的 next_block 语义）
  let insert = true;
  let columnData;

  if (next) {
    insert = next.insert !== false;
    columnData = next.data;

    if (next.blockId) {
      let customNextBlockId = this.getBlockConnections(next.blockId);

      const nextBlock = this.engine.blocks[next.blockId];
      if (!customNextBlockId && nextBlock) {
        customNextBlockId = [
          {
            id: next.blockId,
            blockId: next.blockId,
            connections: new Map([]),
          },
        ];
      }

      if (!customNextBlockId) {
        throw new Error(`Can't find block with "${next.blockId}" id`);
      }

      nextBlockId = customNextBlockId;
    }
  }

  let columnDataObj = null;
  if (columnData != null) {
    const isStructured = isObject(columnData) || Array.isArray(columnData);
    columnDataObj = isStructured ? columnData : { value: columnData };
  }

  if (insert && columnDataObj) {
    const params = Array.isArray(columnDataObj)
      ? columnDataObj
      : [columnDataObj];
    this.addDataToColumn(params);
  }

  return {
    nextBlockId,
    data: columnDataObj ?? {},
  };
}

export default pythonCode;
