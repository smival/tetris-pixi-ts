const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin'); 
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/main.ts',

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

  devtool: 'source-map',
// https://webpack.js.org/guides/hot-module-replacement/
  plugins: [

    new CleanWebpackPlugin({ verbose:true }),
    new CopyWebpackPlugin([{ from: 'assets' }]),
    new HtmlWebpackPlugin({  title: 'Tetrix ts pixi webpack'  }),
    new webpack.HotModuleReplacementPlugin()
  ],

  devServer: {
      inline: true,
      hot: true,
      contentBase: './dist'
  }
};