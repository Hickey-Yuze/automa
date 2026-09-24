#!/bin/bash
# macOS 双击启动：Automa 本机 Python 桥接服务
cd "$(dirname "$0")"
echo "正在启动 Automa Python 桥接服务..."
python3 server.py
if [ $? -ne 0 ]; then
  echo "启动失败：请确认已安装 Python 3（终端里运行 python3 --version 检查）"
  read -n 1 -s -r -p "按任意键关闭..."
fi
