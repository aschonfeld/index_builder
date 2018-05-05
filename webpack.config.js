/* eslint-disable no-restricted-globals */
const webpack = require("webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const autoprefixer = require("autoprefixer");
const postcssNested = require("postcss-nested");

module.exports = {
  devtool: "source-map",
  mode: "development",
  entry: {
    factor_viewer: __dirname + "/static/factor_viewer_main.jsx",
    results_viewer: __dirname + "/static/results_viewer_main.jsx",
    summary_viewer: __dirname + "/static/summary_viewer_main.jsx",
    base_styles: __dirname + "/static/base_styles.js",
    polyfills: __dirname + "/static/polyfills.js",
  },
  output: {
    path: __dirname + "/index_builder/static/dist",
    filename: "[name]_bundle.js",
    publicPath: "/static/dist/",
  },
  resolve: {
    extensions: [".js", ".jsx", ".css"],
  },
  module: {
    rules: [
      {
        test: /.jsx?$/,
        loader: "babel-loader",
        exclude(file) {
          if (file.startsWith(__dirname + "/node_modules/react-tree-menu")) {
            return false;
          }
          return file.startsWith(__dirname + "/node_modules");
        },
        query: {
          cacheDirectory: true,
          presets: ["env", "react"],
        },
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          { loader: "css-loader", options: { importLoaders: 1 } },
          {
            loader: "postcss-loader",
            options: {
              plugins() {
                return [postcssNested, autoprefixer];
              },
            },
          },
        ],
      },
      {
        test: require.resolve("jquery"),
        use: [{ loader: "expose-loader", options: "jQuery" }, { loader: "expose-loader", options: "$" }],
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url-loader",
        options: { limit: 10000, mimetype: "image/svg+xml" },
      },
      {
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url-loader",
        options: { limit: 10000, mimetype: "application/font-woff" },
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url-loader",
        options: { limit: 10000, mimetype: "application/octet-stream" },
      },
      {
        test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url-loader",
        options: { limit: 10000, mimetype: "image/png" },
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: '"dev"',
      },
    }),
    new CleanWebpackPlugin(["grail/static/dist"], {
      verbose: false,
      exclude: [".git_keep"],
    }),
  ],
  externals: {
    window: "window",
    HTMLElement: "HTMLElement",
  },
};
