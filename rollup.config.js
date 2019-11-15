import sass from 'rollup-plugin-sass'

module.exports = {
  input: 'src/main.js',
  output: {
    file: 'dist/js/bundle.js',
    format: 'iife'
  },
  plugins: [
    sass({
      input: 'src/scss/index.scss',

      // Filename to write all styles
      output: 'bundle.css',

      output(styles, styleNodes) {
        writeFileSync('bundle.css', styles)
      }
    })
  ]
}
