// NOTE: To use this example standalone (e.g. outside of repo)
// delete the local development overrides at the bottom of this file

// avoid destructuring for older Node version support
const resolve = require('path').resolve;
const webpack = require('webpack');
require('dotenv').config();

const config = {
  mode: 'development',

  devServer: {
    static: {
      directory: resolve(__dirname, '.'),
    },
    port: 8080,
    historyApiFallback: true,
    open: true,
    hot: true,
  },

  entry: {
    app: resolve('./src/app')
  },

  output: {
    filename: 'app.js',
    library: 'App',
    path: resolve(__dirname, ''),
    publicPath: '/'
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },

  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        include: [resolve('.')],
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/env', '@babel/react']
            }
          },
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },

  // Optional: Enables reading mapbox token from environment variable
  plugins: [
    new webpack.DefinePlugin({
      'process.env.MAPBOX_TOKEN': JSON.stringify(process.env.MAPBOX_TOKEN),
      'process.env.WEBSOCKET_URL': JSON.stringify(process.env.WEBSOCKET_URL)
    })
  ]
};

// Enables bundling against src in this repo rather than the installed version
module.exports = config;
