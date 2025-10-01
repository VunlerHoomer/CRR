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

// 数据库连接（使用连接池）
let isConnected = false

const connectDB = async () => {
  if (isConnected) {
    console.log('使用现有数据库连接')
    return
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-lottery', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    isConnected = db.connections[0].readyState === 1
    console.log('✅ MongoDB 连接成功')
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message)
    // Vercel 中即使数据库连接失败，也要让应用启动
    // 可以返回友好的错误信息
  }
}

// 每次函数调用时连接数据库
connectDB()

// 中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    /\.edgeone\.app$/,
    /\.vercel\.app$/
  ],
  credentials: true
}))
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(morgan('tiny'))

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

// 管理员路由
app.use('/api/admin/auth', require('../src/routes/admin/auth'))
app.use('/api/admin/dashboard', require('../src/routes/admin/dashboard'))
app.use('/api/admin/quiz', require('../src/routes/admin/quiz'))
app.use('/api/admin/lottery', require('../src/routes/admin/lottery'))
app.use('/api/admin/users', require('../src/routes/admin/users'))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    database: isConnected ? '已连接' : '未连接'
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

