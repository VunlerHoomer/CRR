// Vercel Serverless 入口文件 - 修复版本
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

// 全局 Mongoose 配置
mongoose.set('bufferCommands', false)

// 数据库连接
let cachedDb = null
let dbConnectionAttempted = false

const connectDB = async () => {
  // 如果已经连接，直接返回
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb
  }

  // 如果已经尝试连接过但失败，不要重复尝试
  if (dbConnectionAttempted && mongoose.connection.readyState === 0) {
    console.log('⚠️ 数据库连接已失败，跳过重试')
    return null
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI 未配置')
    throw new Error('MONGODB_URI 未配置')
  }

  try {
    console.log('🔄 尝试连接数据库...')
    dbConnectionAttempted = true
    
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 减少超时时间
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000
    })
    
    cachedDb = db
    console.log('✅ MongoDB 已连接')
    return db
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message)
    dbConnectionAttempted = true
    // 不要抛出错误，让应用继续运行
    return null
  }
}

// 中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// CORS配置 - 允许所有来源
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}))

// 数据库连接中间件 - 非阻塞
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    console.error('数据库连接错误:', err.message)
    // 继续执行，不阻塞请求
    next()
  }
})

// 导入并注册所有路由 - 使用try-catch包装
try {
  app.use('/api/auth', require('../src/routes/auth'))
  app.use('/api/user', require('../src/routes/user'))
  app.use('/api/lottery', require('../src/routes/lottery'))
  app.use('/api/ranking', require('../src/routes/ranking'))
  app.use('/api/registration', require('../src/routes/registration'))
  app.use('/api/activity', require('../src/routes/activity'))
  app.use('/api/team', require('../src/routes/team'))
  
  // 尝试注册任务相关路由
  try {
    app.use('/api/task', require('../src/routes/task'))
  } catch (taskError) {
    console.error('⚠️ 任务路由注册失败:', taskError.message)
  }

  // 管理员路由
  app.use('/api/admin/auth', require('../src/routes/admin/auth'))
  app.use('/api/admin/dashboard', require('../src/routes/admin/dashboard'))
  app.use('/api/admin/lottery', require('../src/routes/admin/lottery'))
  app.use('/api/admin/users', require('../src/routes/admin/users'))
  app.use('/api/admin/registration', require('../src/routes/admin/registration'))
  app.use('/api/admin/activity', require('../src/routes/admin/activity'))
  
  // 尝试注册新的管理员路由
  try {
    app.use('/api/admin/area', require('../src/routes/admin/area'))
    app.use('/api/admin/task', require('../src/routes/admin/task'))
  } catch (adminError) {
    console.error('⚠️ 管理员路由注册失败:', adminError.message)
  }
  
} catch (error) {
  console.error('❌ 路由注册失败:', error.message)
}

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? '已连接' : '未连接'
    res.json({
      code: 200,
      message: '服务运行正常',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      version: '2.0.0-fixed'
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '健康检查失败',
      error: error.message
    })
  }
})

// 根路径
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'CRR城市定向 API',
    version: '2.0.0-fixed',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      user: '/api/user',
      activity: '/api/activity',
      registration: '/api/registration',
      lottery: '/api/lottery',
      ranking: '/api/ranking',
      team: '/api/team',
      task: '/api/task',
      admin: '/api/admin/*'
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
    path: req.originalUrl,
    hint: '访问 / 查看可用端点'
  })
})

// 导出给 Vercel
module.exports = app
