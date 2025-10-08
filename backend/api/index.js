// Vercel Serverless 入口文件
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { rateLimit } = require('express-rate-limit')
require('dotenv').config()

// 导入路由
const authRoutes = require('../src/routes/auth')
const userRoutes = require('../src/routes/user')
const quizRoutes = require('../src/routes/quiz')
const lotteryRoutes = require('../src/routes/lottery')
const rankingRoutes = require('../src/routes/ranking')
const errorHandler = require('../src/middleware/errorHandler')

// 创建 Express 应用
const app = express()

// 全局 Mongoose 配置（避免命令缓冲）
mongoose.set('bufferCommands', false)

// 数据库连接（确保真正连接成功后再返回）
const connectDB = async () => {
  const isConnected = () => mongoose.connection.readyState === 1

  if (isConnected()) return

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI 环境变量未配置')
    }

    // 如果未连接或正在断开/断开，发起连接（正在连接的场景下，Mongoose 会复用同一个连接 Promise）
    if (mongoose.connection.readyState !== 2) {
      console.log('🔄 连接 MongoDB Atlas...')
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 1
      })
    }

    // 统一等待直到 readyState === 1 或超时
    const start = Date.now()
    const timeoutMs = 30000
    while (!isConnected()) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('等待 MongoDB 连接超时')
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    if (isConnected()) {
      console.log('✅ MongoDB 已连接')
    }
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message)
    throw error
  }
}

// 初始化数据库连接
connectDB().catch(err => console.error('初始化数据库连接失败:', err))

// 中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      process.env.FRONTEND_URL
    ]
    
    // 允许的域名模式
    const allowedPatterns = [
      /\.edgeone\.app$/,
      /\.edgeone\.run$/,
      /\.vercel\.app$/,
      /^https?:\/\/cityrunride-.*\.edgeone\.run$/
    ]
    
    // 如果没有 origin（同源请求或某些工具），允许
    if (!origin) {
      return callback(null, true)
    }
    
    // 检查是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    
    // 检查是否匹配允许的模式
    for (const pattern of allowedPatterns) {
      if (pattern.test(origin)) {
        return callback(null, true)
      }
    }
    
    // 开发环境允许所有
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }
    
    // 其他情况拒绝
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}))
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(morgan('tiny'))

// 确保每次请求都已连接数据库（避免 bufferCommands=false 时查询早于连接）
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    res.status(500).json({ code: 500, message: '数据库连接失败', detail: err?.message })
  }
})

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100,
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  }
})
app.use('/api/', limiter)

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/quiz', quizRoutes)
app.use('/api/lottery', lotteryRoutes)
app.use('/api/ranking', rankingRoutes)

// 用户端任务路由（测试版本）
app.use('/api/task', require('../src/routes/task'))

// 活动相关路由
app.use('/api/activity', require('../src/routes/activity'))

// 队伍相关路由
app.use('/api/team', require('../src/routes/team'))

// 管理员路由
app.use('/api/admin/auth', require('../src/routes/admin/auth'))
app.use('/api/admin/dashboard', require('../src/routes/admin/dashboard'))
app.use('/api/admin/quiz', require('../src/routes/admin/quiz'))
app.use('/api/admin/lottery', require('../src/routes/admin/lottery'))
app.use('/api/admin/users', require('../src/routes/admin/users'))
// 临时注释掉任务管理路由，避免部署错误
// app.use('/api/admin/tasks', require('../src/routes/admin/tasks'))

// 健康检查
app.get('/api/health', async (req, res) => {
  // 确保数据库已连接
  await connectDB()
  
  // 检查 Mongoose 连接状态
  const dbStatus = mongoose.connection.readyState === 1 ? '已连接' : '未连接'
  
  res.json({
    code: 200,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    mongooseState: mongoose.connection.readyState,
    envCheck: process.env.MONGODB_URI ? '已配置' : '未配置'
  })
})

// 根路径
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '答题抽签互动网站 API',
    version: '1.0.0',
    docs: '/api/health'
  })
})

// 全局错误处理
app.use(errorHandler)

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    path: req.originalUrl
  })
})

// 导出 app 给 Vercel
module.exports = app

