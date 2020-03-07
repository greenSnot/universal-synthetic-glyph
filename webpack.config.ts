import { resolve, join } from 'path';
import { sync } from 'glob';

import { Configuration } from 'webpack';

const files = sync('./src/**/*.{ts,tsx}');
const cfg: Configuration = {
  entry: files.reduce((m, i: string) => {
    m[i.replace('./src/', './').replace(/.tsx?$/, '')] = i;
    return m;
  }, {} as { [file: string]: string }),
  output: {
    path: resolve(__dirname, 'lib'),
    filename: '[name].js',
    sourceMapFilename: '[name].map',
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              // '@babel/preset-env',
            ],
            plugins: [
              [
                '@babel/plugin-transform-modules-commonjs',
                {
                  allowTopLevelThis: true,
                },
              ],
              [
                '@babel/plugin-proposal-decorators',
                {
                  legacy: true,
                },
              ],
              [
                '@babel/plugin-transform-typescript',
                {
                  isTSX: true,
                },
              ],
              '@babel/plugin-transform-react-jsx',
              'babel-plugin-styled-components',
              '@babel/plugin-proposal-class-properties',
            ],
          },
        },
      },
    ],
  },
};

export default cfg;
