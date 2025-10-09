// 最小化版本，用于排查问题
const express = require('express')
const cors = require('cors')

const app = express()

// 中间件
app.use(express.json())
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}))

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ code: 200, message: '测试成功' })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  })
})

// 活动列表 - 最小版本
app.get('/api/activity/list', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: {
      activities: []
    }
  })
})

// 根路径
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'CRR城市定向 API - 最小版本'
  })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    code: 500,
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
