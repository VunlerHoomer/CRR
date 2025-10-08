import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 生产环境优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除 console
        drop_debugger: true,  // 移除 debugger
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'], // 移除特定函数调用
        passes: 2 // 多次压缩优化
      },
      mangle: {
        safari10: true
      }
    },
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // UI框架
          'element-plus': ['element-plus'],
          'element-icons': ['@element-plus/icons-vue'],
          // 工具库
          'utils': ['axios', 'dayjs']
        },
        // 静态资源分类打包
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `media/[name]-[hash].${ext}`
          }
          if (/\.(png|jpe?g|gif|svg)(\?.*)?$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${ext}`
          }
          return `[ext]/[name]-[hash].${ext}`
        }
      }
    },
    // 设置打包大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用gzip压缩
    reportCompressedSize: true,
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 源码映射（生产环境关闭）
    sourcemap: false
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      '@element-plus/icons-vue',
      'axios'
    ]
  },
  // CSS优化
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
})


