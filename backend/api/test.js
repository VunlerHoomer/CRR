// 简化的测试版本，用于排查问题
const express = require('express')
const cors = require('cors')

const app = express()

// CORS配置
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}))

// 中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({
    code: 200,
    message: '测试成功',
    timestamp: new Date().toISOString()
  })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    version: 'test-1.0.0'
  })
})

// 根路径
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'CRR城市定向 API - 测试版本',
    version: 'test-1.0.0',
    endpoints: {
      health: '/api/health',
      test: '/api/test'
    }
  })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误'
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    path: req.originalUrl
  })
})

module.exports = app
