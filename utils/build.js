// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

const webpack = require('webpack');
const config = require('../webpack.config');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

webpack(config, function (err, stats) {
  if (err) throw err;
  if (stats.hasErrors()) {
    console.error('Build failed with errors:');
    console.error(
      stats.toString({ errors: true, errorDetails: false, colors: false })
    );
    process.exit(1);
  }
});
