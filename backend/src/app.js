const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const { createServer } = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const connectDB = require('./config/database')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const quizRoutes = require('./routes/quiz')
const lotteryRoutes = require('./routes/lottery')
const rankingRoutes = require('./routes/ranking')
const errorHandler = require('./middleware/errorHandler')
const socketHandler = require('./services/socketHandler')
const { 
  enableCompression, 
  securityHeaders, 
  cacheMiddleware, 
  responseTime,
  apiLimiter,
  loginLimiter 
} = require('./middleware/performance')

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// 连接数据库
connectDB()

// 性能优化中间件
app.use(enableCompression) // gzip压缩
app.use(securityHeaders) // 安全头
app.use(responseTime) // 响应时间监控

// 基础中间件 - 简化CORS配置
app.use(cors({
  origin: true, // 允许所有来源（临时调试）
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 限流中间件
app.use('/api/', apiLimiter)
app.use('/api/auth/login', loginLimiter)

// 路由（为只读路由添加缓存）
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/quiz', cacheMiddleware(2 * 60 * 1000), quizRoutes) // 2分钟缓存
app.use('/api/lottery', cacheMiddleware(5 * 60 * 1000), lotteryRoutes) // 5分钟缓存
app.use('/api/ranking', cacheMiddleware(1 * 60 * 1000), rankingRoutes) // 1分钟缓存
app.use('/api/registration', require('./routes/registration')) // 报名路由

// 管理员路由
app.use('/api/admin/auth', require('./routes/admin/auth'))
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'))
app.use('/api/admin/quiz', require('./routes/admin/quiz'))
app.use('/api/admin/lottery', require('./routes/admin/lottery'))
app.use('/api/admin/users', require('./routes/admin/users'))
app.use('/api/admin/registration', require('./routes/admin/registration')) // 报名管理路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  })
})

// Socket.IO 处理
socketHandler(io)

// 错误处理中间件
app.use(errorHandler)

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`)
  console.log(`📱 环境: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 前端地址: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
})

module.exports = { app, server, io }
