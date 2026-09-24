@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动 Automa Python 桥接服务...
python server.py
if errorlevel 1 (
  echo.
  echo 启动失败：请确认已安装 Python 3 并加入 PATH（命令行运行 python --version 检查）
  pause
)
