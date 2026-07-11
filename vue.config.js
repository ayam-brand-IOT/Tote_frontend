const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // Compilar a la carpeta public del backend
  outputDir: '../Tote_backend/public/app',
  publicPath: '/app/',
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'Ayam Brand — Production Monitor'
      return args
    })
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
