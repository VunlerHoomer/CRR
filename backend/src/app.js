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

// 中间件
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 限流中间件
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 100次请求
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
app.use('/api/admin/auth', require('./routes/admin/auth'))
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'))
app.use('/api/admin/quiz', require('./routes/admin/quiz'))
app.use('/api/admin/lottery', require('./routes/admin/lottery'))
app.use('/api/admin/users', require('./routes/admin/users'))

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
