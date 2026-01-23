module.exports = {
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            convertPathData: false,
            convertShapeToPath: false,
          },
        },
      },
    ],
  },
};
