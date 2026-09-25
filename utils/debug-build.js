// 临时诊断脚本：跑完整 webpack 构建并打印 stats 真实错误（build.js 会静默吞掉编译错误）
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

const webpack = require('webpack');
const config = require('../webpack.config');

delete config.chromeExtensionBoilerplate;
config.mode = 'production';

webpack(config, (err, stats) => {
  if (err) {
    console.error('FATAL:', err);
    process.exit(1);
  }
  const info = stats.toJson({
    errors: true,
    errorDetails: true,
    moduleTrace: true,
  });
  console.log('hasErrors:', stats.hasErrors());
  (info.errors || []).slice(0, 5).forEach((e) => {
    if (e.moduleName) console.log('MODULE:', e.moduleName);
    if (e.loc) console.log('LOC:', JSON.stringify(e.loc));
    const msg = typeof e === 'string' ? e : e.message || JSON.stringify(e);
    console.log(
      `===== ERROR =====\n${msg.split('\n').slice(0, 15).join('\n')}`
    );
  });
  process.exit(stats.hasErrors() ? 1 : 0);
});
