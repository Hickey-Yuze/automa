export default {
  baseApiUrl: '',
  // AI Power（Automa 官方 AI 工作流服务）：
  // 控制台 aipower.automa.site（实际跳转 goautoma.com），API 走 api-aipower.automa.site。
  // 上游仅在私有 secrets.production.js 里注入这两个字段，本地构建缺失会导致
  // 「AI 工作流」块弹窗的「打开 AI Power 设置」拼出 /undefined/authorization（404）。
  apApiUrl: 'https://api-aipower.automa.site',
  apHomeUrl: 'https://aipower.goautoma.com',
};
