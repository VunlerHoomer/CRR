const express = require('express')
const User = require('../../models/User')
const Quiz = require('../../models/Quiz')
const Lottery = require('../../models/Lottery')
const QuizRecord = require('../../models/QuizRecord')
const LotteryRecord = require('../../models/LotteryRecord')
const { adminAuth } = require('../../middleware/adminAuth')

const router = express.Router()

// 所有路由都需要管理员权限
router.use(adminAuth)

// 获取仪表盘概览数据
router.get('/overview', async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 用户统计
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const todayNewUsers = await User.countDocuments({ createdAt: { $gte: today } })

    // 题目统计
    const totalQuizzes = await Quiz.countDocuments()
    const activeQuizzes = await Quiz.countDocuments({ isActive: true })

    // 抽签统计
    const totalLotteries = await Lottery.countDocuments()
    const activeLotteries = await Lottery.countDocuments({ status: 'active' })

    // 今日活动统计
    const todayQuizRecords = await QuizRecord.countDocuments({ createdAt: { $gte: today } })
    const todayLotteryRecords = await LotteryRecord.countDocuments({ createdAt: { $gte: today } })

    // 最近7天数据
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    
    const weeklyQuizRecords = await QuizRecord.countDocuments({ createdAt: { $gte: last7Days } })
    const weeklyLotteryRecords = await LotteryRecord.countDocuments({ createdAt: { $gte: last7Days } })

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          todayNew: todayNewUsers
        },
        quizzes: {
          total: totalQuizzes,
          active: activeQuizzes,
          todayRecords: todayQuizRecords,
          weeklyRecords: weeklyQuizRecords
        },
        lotteries: {
          total: totalLotteries,
          active: activeLotteries,
          todayRecords: todayLotteryRecords,
          weeklyRecords: weeklyLotteryRecords
        }
      }
    })
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取仪表盘数据失败'
    })
  }
})

// 获取最近活动
router.get('/recent-activities', async (req, res) => {
  try {
    const { limit = 20 } = req.query

    // 获取最近的答题记录
    const recentQuizRecords = await QuizRecord.find()
      .populate('userId', 'nickname phone')
      .populate('quizId', 'question')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    // 获取最近的抽签记录
    const recentLotteryRecords = await LotteryRecord.find()
      .populate('userId', 'nickname phone')
      .populate('lotteryId', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        quizRecords: recentQuizRecords,
        lotteryRecords: recentLotteryRecords
      }
    })
  } catch (error) {
    console.error('获取最近活动失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取最近活动失败'
    })
  }
})

module.exports = router
