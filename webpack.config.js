const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const WebpackExtensionReloader = require("webpack-extension-reloader");
const path = require("path");
const { watch } = require("fs");

// 定义isProduction变量
const isProduction = process.env.NODE_ENV === "production";

console.log("isProduction:", isProduction);

module.exports = {
  mode: "development",
  entry: {
    background: "./src/background.ts",
  },
  output: {
    filename: "[name].js",
    path: isProduction
      ? path.resolve(__dirname, "dist/prod")
      : path.resolve(__dirname, "dist/dev"),
    // libraryTarget: "umd", // 为了兼容Chrome扩展的脚本加载
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    // Adds script resource to popup.html
    // new HtmlWebpackPlugin({
    //   template: "./src/popup.html",
    //   filename: "popup.html",
    // }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "public", to: "." }, // 复制静态资源到dist
      ],
    }),
    // 在开发时启用Chrome扩展重新加载
    new WebpackExtensionReloader({
      entries: {
        background: "background.js",
      },
    }),
  ],
  devtool: isProduction ? false : "source-map", // 用于调试
};
