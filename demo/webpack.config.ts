import { resolve, join } from 'path';

import { Configuration } from 'webpack';
import HTMLWebpackPlugin = require('html-webpack-plugin');

const cfg: Configuration = {
  entry: join(__dirname, './src/index.tsx'),
  output: {
    path: resolve(__dirname, 'dist'),
    filename: 'demo.bundle.js',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [
              ['@babel/plugin-proposal-decorators', {
                legacy: true,
              }],
              'babel-plugin-styled-components',
              '@babel/plugin-proposal-class-properties',
            ],
          },
        },
      },
    ],
  },
  plugins: [new HTMLWebpackPlugin()],
};

export default cfg;
