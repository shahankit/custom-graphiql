var path = require('path');
var webpack = require('webpack');
var paths = require('./paths');

module.exports = {
  devtool: 'eval',
  entry: [
    'babel-polyfill',
    'react-hot-loader/patch',
    'webpack-hot-middleware/client',
    paths.appContainerJs
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loaders: ['babel'],
      include: [
        paths.appSrc,
        paths.appContainerJs
      ]
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
    }]
  }
};
