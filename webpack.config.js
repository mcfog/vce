const path = require('path');
const fs = require('fs');

const babelrc = JSON.parse(fs.readFileSync('./.babelrc'));

module.exports = {
  entry: './lib/index.js',
  output: {
    filename: 'vce.min.js',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: babelrc,
        },
      }, // end babel-loader
    ], // rules
  }, // module
};
