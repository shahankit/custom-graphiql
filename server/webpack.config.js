const webpack = require('webpack');
const paths = require('./paths');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const publicPath = '/'

module.exports = {
  mode: 'development',
  entry: [
    paths.appContainerJs
  ],
  devtool: 'cheap-module-source-map',
  output: {
    filename: 'bundle.js',
    publicPath: publicPath,
  },
  module: {
    rules: [
      {
        test: /\.js.flow$/, // assuming the files are named .js.flow 
        enforce: 'pre',
        use: ['remove-flow-types-loader']
      },
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        enforce: 'pre',
        use: [
          require.resolve('babel-loader')
        ],
        include: [
          paths.appSrc,
          paths.appContainerJs
        ]
      },
      // Avoid "require is not defined" errors
      // (found in graphql@0.13.2)
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }
    ]
  },
  plugins: [
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin(
      {
        inject: true,
        template: paths.appHtml,
      }
    ),
    new webpack.HotModuleReplacementPlugin()
  ],
  devServer: {
    // Enable gzip compression of generated files.
    compress: true,
    // Enable hot reloading server. It will provide /sockjs-node/ endpoint
    // for the WebpackDevServer client so it can learn when the files were
    // updated. The WebpackDevServer client is included as an entry point
    // in the Webpack development configuration. Note that only changes
    // to CSS are currently hot reloaded. JS changes will refresh the browser.
    hot: true,
    port: process.env.PORT || 3000,
    // It is important to tell WebpackDevServer to use the same "root" path
    // as we specified in the config. In development, we always serve from /.
    publicPath: publicPath,
    stats: {
      all: false,
      // Show the url we're serving at
      wds: true,
      // Config for minimal console.log mess.
      assets: false,
      colors: true,
      version: false,
      hash: false,
      timings: false,
      chunks: false,
      chunkModules: false,
    },
  },
};
