#!/bin/bash
# macOS 双击启动：Automa 本机 Python 桥接服务
cd "$(dirname "$0")"
echo "正在启动 Automa Python 桥接服务..."

# 端口被占用时自动结束旧桥（避免 Address already in use 且提示误导）
PORT=27182
OLD_PIDS=$(lsof -ti :"$PORT" 2>/dev/null)
if [ -n "$OLD_PIDS" ]; then
  echo "检测到旧桥进程（PID: $(echo "$OLD_PIDS" | tr '\n' ' ')），自动结束..."
  echo "$OLD_PIDS" | xargs kill 2>/dev/null
  sleep 1
fi

python3 server.py
if [ $? -ne 0 ]; then
  echo "启动失败：请把上面的报错截图反馈（常见原因：Python 3 未安装、端口被其他程序占用）"
  read -n 1 -s -r -p "按任意键关闭..."
fi
