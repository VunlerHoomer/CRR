const express = require('express')
const User = require('../models/User')
const QuizRecord = require('../models/QuizRecord')
const LotteryRecord = require('../models/LotteryRecord')

const router = express.Router()

// 获取排行榜
router.get('/list', async (req, res) => {
  try {
    const { type = 'points', period = 'all', limit = 50 } = req.query
    
    let query = { isActive: true }
    let sort = {}
    
    // 根据类型设置排序
    switch (type) {
      case 'points':
        sort = { points: -1, totalQuizCount: -1 }
        break
      case 'accuracy':
        sort = { correctQuizCount: -1, totalQuizCount: 1 }
        break
      case 'quiz':
        sort = { totalQuizCount: -1, points: -1 }
        break
      case 'lottery':
        sort = { totalLotteryCount: -1, points: -1 }
        break
      default:
        sort = { points: -1 }
    }

    // 根据时间段过滤
    if (period !== 'all') {
      const now = new Date()
      let startDate
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
      }
      
      if (startDate) {
        // 这里需要根据时间段重新计算用户数据
        // 简化处理，直接返回全量数据
      }
    }

    const users = await User.find(query)
      .select('nickname avatar points level totalQuizCount correctQuizCount totalLotteryCount')
      .sort(sort)
      .limit(parseInt(limit))

    // 计算排名和准确率
    const ranking = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      points: user.points,
      level: user.level,
      totalQuizCount: user.totalQuizCount,
      correctQuizCount: user.correctQuizCount,
      accuracy: user.totalQuizCount > 0 ? Math.round((user.correctQuizCount / user.totalQuizCount) * 100) : 0,
      totalLotteryCount: user.totalLotteryCount
    }))

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ranking,
        type,
        period,
        total: ranking.length
      }
    })
  } catch (error) {
    console.error('获取排行榜失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取排行榜失败'
    })
  }
})

// 获取实时统计
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true })
    const totalQuizCount = await QuizRecord.countDocuments()
    const totalLotteryCount = await LotteryRecord.countDocuments()
    
    // 今日新增用户
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayUsers = await User.countDocuments({
      isActive: true,
      createdAt: { $gte: today }
    })

    // 今日答题数
    const todayQuizCount = await QuizRecord.countDocuments({
      createdAt: { $gte: today }
    })

    // 今日抽签数
    const todayLotteryCount = await LotteryRecord.countDocuments({
      createdAt: { $gte: today }
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        totalUsers,
        totalQuizCount,
        totalLotteryCount,
        todayUsers,
        todayQuizCount,
        todayLotteryCount
      }
    })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取统计失败'
    })
  }
})

module.exports = router
