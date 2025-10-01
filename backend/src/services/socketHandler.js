const jwt = require('jsonwebtoken')
const User = require('../models/User')

const socketHandler = (io) => {
  // 用户连接处理
  io.on('connection', async (socket) => {
    console.log('用户连接:', socket.id)

    // 验证用户身份
    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development')
        const user = await User.findById(decoded.id).select('-password')
        
        if (user) {
          socket.userId = user._id
          socket.user = user
          socket.join(`user_${user._id}`)
          socket.emit('authenticated', { success: true })
          console.log(`用户 ${user.nickname} 已认证`)
        } else {
          socket.emit('authenticated', { success: false, message: '用户不存在' })
        }
      } catch (error) {
        socket.emit('authenticated', { success: false, message: '认证失败' })
      }
    })

    // 加入房间
    socket.on('join_room', (room) => {
      socket.join(room)
      console.log(`用户 ${socket.id} 加入房间 ${room}`)
    })

    // 离开房间
    socket.on('leave_room', (room) => {
      socket.leave(room)
      console.log(`用户 ${socket.id} 离开房间 ${room}`)
    })

    // 发送消息
    socket.on('send_message', (data) => {
      const { room, message, type = 'text' } = data
      
      if (socket.user) {
        io.to(room).emit('new_message', {
          id: Date.now(),
          userId: socket.user._id,
          nickname: socket.user.nickname,
          avatar: socket.user.avatar,
          message,
          type,
          timestamp: new Date()
        })
      }
    })

    // 答题进度更新
    socket.on('quiz_progress', (data) => {
      const { room, progress, userId } = data
      io.to(room).emit('quiz_progress_update', {
        userId,
        progress,
        timestamp: new Date()
      })
    })

    // 抽签结果广播
    socket.on('lottery_result', (data) => {
      const { room, result, userId } = data
      io.to(room).emit('lottery_result_broadcast', {
        userId,
        result,
        timestamp: new Date()
      })
    })

    // 用户断开连接
    socket.on('disconnect', () => {
      console.log('用户断开连接:', socket.id)
    })
  })

  // 定期广播排行榜更新
  setInterval(async () => {
    try {
      const topUsers = await User.find({ isActive: true })
        .select('nickname avatar points level')
        .sort({ points: -1 })
        .limit(10)

      io.emit('ranking_update', {
        type: 'points',
        ranking: topUsers.map((user, index) => ({
          rank: index + 1,
          nickname: user.nickname,
          avatar: user.avatar,
          points: user.points,
          level: user.level
        })),
        timestamp: new Date()
      })
    } catch (error) {
      console.error('广播排行榜更新失败:', error)
    }
  }, 30000) // 每30秒更新一次

  // 定期广播实时统计
  setInterval(async () => {
    try {
      const totalUsers = await User.countDocuments({ isActive: true })
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayUsers = await User.countDocuments({
        isActive: true,
        createdAt: { $gte: today }
      })

      io.emit('stats_update', {
        totalUsers,
        todayUsers,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('广播统计更新失败:', error)
    }
  }, 60000) // 每分钟更新一次
}

module.exports = socketHandler
