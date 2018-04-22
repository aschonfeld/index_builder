/* eslint-disable no-restricted-globals */

const assign = require("lodash/assign");
const webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const baseConfig = require("./webpack.config.js");

const config = assign({}, baseConfig, {
  mode: "production",
  devtool: "source-map",
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          compress: {
            warnings: false,
          },
        },
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: '"production"',
      },
    }),
  ],
});

module.exports = config;
