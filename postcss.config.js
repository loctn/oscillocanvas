module.exports = {
  plugins: {
    'postcss-import': {
      path: 'src/'
    },
    'postcss-cssnext': {
      browsers: ['last 2 versions', '> 5%'],
    },
  }
};