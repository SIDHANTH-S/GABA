module.exports = {
  target: 'electron-main',
  entry: './electron-main/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: __dirname,
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
