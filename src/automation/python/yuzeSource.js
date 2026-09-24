// yuze：Automa Python 块的内置 API（快照式数据交换）
// 单一真源：本文件的 Python 源码同时供「本机桥接」与「Pyodide」两条通道执行，
// 保证两个通道里 yuze 行为完全一致。改动后需重新构建扩展并重启桥接服务。
//
// 执行约定：
//   1. 执行器（bridge/pyodide runner）先 exec 本源码，再调用 _yuze_init(variables, table) 注入快照；
//   2. 随后 exec 用户代码（用户 import yuze 即可用）；
//   3. 执行结束调用 _yuze_dump() 得到 JSON 字符串：{variables, table, logs, next}。
export default `
# ---------- yuze: Automa Python 块内置 API ----------
import json as _yuze_json
import types as _yuze_types
import sys as _yuze_sys
import copy as _yuze_copy

_yuze_snapshot = {"variables": {}, "table": [], "logs": [], "next": None}


def _yuze_init(variables, table):
    _yuze_snapshot["variables"] = variables if isinstance(variables, dict) else {}
    _yuze_snapshot["table"] = table if isinstance(table, list) else []
    _yuze_snapshot["logs"] = []
    _yuze_snapshot["next"] = None


def get_var(name, default=None):
    """读取 Automa 工作流变量"""
    return _yuze_snapshot["variables"].get(name, default)


def set_var(name, value):
    """写入 Automa 工作流变量（块执行结束后回写；值需可 JSON 序列化）"""
    _yuze_snapshot["variables"][name] = value


def get_table():
    """读取 Automa 表格（返回深拷贝的二维列表）"""
    return _yuze_copy.deepcopy(_yuze_snapshot["table"])


def set_table(rows):
    """整体替换 Automa 表格，rows 为二维列表"""
    if not isinstance(rows, list):
        raise TypeError("set_table() 需要二维列表（每行一个列表）")
    _yuze_snapshot["table"] = rows


def add_row(row):
    """向表格末尾追加一行"""
    _yuze_snapshot["table"].append(row)


def next_block(data=None, insert=True, block_id=None):
    """控制流向：data 传给下一个块的数据；insert=False 不写入表格；block_id 可指定下一块"""
    _yuze_snapshot["next"] = {"data": data, "insert": insert, "blockId": block_id}


def log(*parts):
    """写日志（块日志中可见）"""
    try:
        text = " ".join("" if p is None else str(p) for p in parts)
    except Exception:
        text = repr(parts)
    _yuze_snapshot["logs"].append(text)


def _yuze_dump():
    return _yuze_json.dumps(_yuze_snapshot, ensure_ascii=False, default=str)


# 注册为可 import 的模块：用户代码里 "import yuze" 即可使用
yuze = _yuze_types.ModuleType("yuze")
yuze.__dict__.update(
    {
        "get_var": get_var,
        "set_var": set_var,
        "get_table": get_table,
        "set_table": set_table,
        "add_row": add_row,
        "next_block": next_block,
        "log": log,
    }
)
_yuze_sys.modules["yuze"] = yuze
`;
