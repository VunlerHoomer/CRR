// Vercel Serverless 入口文件
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

// 全局 Mongoose 配置
mongoose.set('bufferCommands', false)

// 数据库连接
let cachedDb = null
const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI 未配置')
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    })
    cachedDb = db
    console.log('✅ MongoDB 已连接')
    return db
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message)
    throw error
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

// 确保数据库连接 - 非阻塞版本
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    console.error('数据库连接错误:', err.message)
    // 对于某些路由，允许在没有数据库的情况下继续
    if (req.path === '/api/health' || req.path === '/') {
      next()
    } else {
      res.status(500).json({ 
        code: 500, 
        message: '数据库连接失败', 
        detail: err.message 
      })
    }
  }
})

// 导入并注册所有路由
app.use('/api/auth', require('../src/routes/auth'))
app.use('/api/user', require('../src/routes/user'))
app.use('/api/lottery', require('../src/routes/lottery'))
app.use('/api/ranking', require('../src/routes/ranking'))
app.use('/api/registration', require('../src/routes/registration'))
app.use('/api/activity', require('../src/routes/activity'))
app.use('/api/team', require('../src/routes/team'))

// 尝试注册任务路由
try {
  console.log('🔄 正在注册任务路由...')
  app.use('/api/task', require('../src/routes/task-with-user-id'))
  console.log('✅ 任务路由注册成功')
} catch (error) {
  console.error('❌ 任务路由注册失败:', error.message)
  console.error('错误堆栈:', error.stack)
}

// 调试路由
try {
  app.use('/api/debug', require('../src/routes/debug'))
  console.log('✅ 调试路由注册成功')
} catch (error) {
  console.error('❌ 调试路由注册失败:', error.message)
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
} catch (error) {
  console.error('⚠️ 管理员路由注册失败:', error.message)
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
      version: '2.0.0'
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
    version: '2.0.1',
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
