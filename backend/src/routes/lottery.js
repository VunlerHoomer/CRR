const express = require('express')
const { body, validationResult } = require('express-validator')
const Lottery = require('../models/Lottery')
const LotteryRecord = require('../models/LotteryRecord')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()

// 获取抽签列表
router.get('/list', auth, async (req, res) => {
  try {
    const { category, status = 'active' } = req.query
    
    const query = { status }
    if (category) query.category = category

    const lotteries = await Lottery.find(query)
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({
      code: 200,
      message: '获取成功',
      data: { lotteries }
    })
  } catch (error) {
    console.error('获取抽签列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取抽签列表失败'
    })
  }
})

// 执行抽签
router.post('/draw', [
  auth,
  body('lotteryId').isMongoId().withMessage('抽签ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { lotteryId } = req.body

    // 获取抽签信息
    const lottery = await Lottery.findById(lotteryId)
    if (!lottery) {
      return res.status(404).json({
        code: 404,
        message: '抽签不存在'
      })
    }

    if (lottery.status !== 'active') {
      return res.status(400).json({
        code: 400,
        message: '抽签已结束'
      })
    }

    // 检查用户今日抽签次数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayRecords = await LotteryRecord.countDocuments({
      userId: req.user._id,
      lotteryId: lotteryId,
      createdAt: { $gte: today }
    })

    if (todayRecords >= lottery.maxDraws) {
      return res.status(400).json({
        code: 400,
        message: `今日抽签次数已达上限（${lottery.maxDraws}次），请明天再来`
      })
    }

    // 执行抽签逻辑
    const result = performLottery(lottery)
    
    // 创建抽签记录
    const record = new LotteryRecord({
      userId: req.user._id,
      lotteryId: lotteryId,
      result: result,
      points: result.points || 0
    })

    await record.save()

    // 更新用户统计
    const user = await User.findById(req.user._id)
    user.totalLotteryCount += 1
    if (result.points > 0) {
      user.points += result.points
      user.level = user.calculateLevel()
    }
    await user.save()

    res.json({
      code: 200,
      message: '抽签成功',
      data: {
        result,
        record: {
          id: record._id,
          createdAt: record.createdAt
        }
      }
    })
  } catch (error) {
    console.error('抽签失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '抽签失败'
    })
  }
})

// 获取抽签记录
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const records = await LotteryRecord.find({ userId: req.user._id })
      .populate('lotteryId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await LotteryRecord.countDocuments({ userId: req.user._id })

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取抽签记录失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取抽签记录失败'
    })
  }
})

// 抽签算法
function performLottery(lottery) {
  const { items, probabilities } = lottery
  
  // 生成随机数
  const random = Math.random()
  let cumulativeProbability = 0
  
  for (let i = 0; i < items.length; i++) {
    cumulativeProbability += probabilities[i] / 100
    if (random <= cumulativeProbability) {
      return {
        item: items[i],
        probability: probabilities[i],
        points: calculatePoints(probabilities[i])
      }
    }
  }
  
  // 默认返回最后一个
  return {
    item: items[items.length - 1],
    probability: probabilities[probabilities.length - 1],
    points: calculatePoints(probabilities[probabilities.length - 1])
  }
}

// 根据概率计算积分
function calculatePoints(probability) {
  if (probability >= 50) return 5
  if (probability >= 20) return 10
  if (probability >= 10) return 20
  if (probability >= 5) return 50
  return 100
}

module.exports = router
