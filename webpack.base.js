const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin'); 
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|svg|jpg|gif|mp3|ogg)$/,
        use: 'file-loader'
      }
    ]
  },

  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },

// https://webpack.js.org/guides/hot-module-replacement/
  plugins: [

    new CleanWebpackPlugin({ verbose:true }),
    new CopyWebpackPlugin([{ from: 'assets' }]),
    new HtmlWebpackPlugin({  title: `Tetris v${JSON.stringify(require('./package.json').version)} (ts pixi webpack)`  }),
    new webpack.HotModuleReplacementPlugin()
  ]
};