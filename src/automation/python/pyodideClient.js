// Pyodide（浏览器内 WASM Python）客户端
// 一期占位：通道调度已在 handlerPythonCode 中接好，
// 下一阶段在此实现 offscreen document 通信与 pyodide 运行时加载。
export async function runPyodide() {
  throw new Error('pyodide-not-ready');
}
