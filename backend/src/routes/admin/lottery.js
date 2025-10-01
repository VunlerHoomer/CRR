const express = require('express')
const { body, validationResult } = require('express-validator')
const Lottery = require('../../models/Lottery')
const LotteryRecord = require('../../models/LotteryRecord')
const { adminAuth, checkPermission } = require('../../middleware/adminAuth')

const router = express.Router()

// 所有路由都需要管理员权限
router.use(adminAuth)
router.use(checkPermission('manage_lottery'))

// 获取所有抽签活动（带分页）
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (category) query.category = category
    if (status) query.status = status

    const lotteries = await Lottery.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Lottery.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        lotteries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取抽签列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取抽签列表失败'
    })
  }
})

// 获取单个抽签详情
router.get('/:id', async (req, res) => {
  try {
    const lottery = await Lottery.findById(req.params.id)
    
    if (!lottery) {
      return res.status(404).json({
        code: 404,
        message: '抽签不存在'
      })
    }

    // 获取参与统计
    const totalDraws = await LotteryRecord.countDocuments({ lotteryId: req.params.id })

    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        lottery,
        stats: {
          totalDraws
        }
      }
    })
  } catch (error) {
    console.error('获取抽签详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取抽签详情失败'
    })
  }
})

// 创建抽签活动
router.post('/create', [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('category').isIn(['daily', 'weekly', 'special', 'event']).withMessage('分类不正确'),
  body('items').isArray({ min: 2 }).withMessage('至少需要2个奖品'),
  body('probabilities').isArray({ min: 2 }).withMessage('至少需要2个概率'),
  body('maxDraws').isInt({ min: 1 }).withMessage('最大抽签次数至少为1')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { title, description, category, items, probabilities, maxDraws, startTime, endTime } = req.body

    // 验证概率总和
    const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0)
    if (Math.abs(totalProbability - 100) > 0.01) {
      return res.status(400).json({
        code: 400,
        message: '概率总和必须为100%'
      })
    }

    const lotteryData = {
      title,
      description,
      category,
      items,
      probabilities,
      maxDraws,
      createdBy: req.admin._id
    }

    if (startTime) lotteryData.startTime = new Date(startTime)
    if (endTime) lotteryData.endTime = new Date(endTime)

    const lottery = new Lottery(lotteryData)
    await lottery.save()

    res.status(201).json({
      code: 200,
      message: '抽签活动创建成功',
      data: { lottery }
    })
  } catch (error) {
    console.error('创建抽签失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '创建抽签失败'
    })
  }
})

// 更新抽签活动
router.put('/:id', async (req, res) => {
  try {
    const lottery = await Lottery.findById(req.params.id)
    
    if (!lottery) {
      return res.status(404).json({
        code: 404,
        message: '抽签不存在'
      })
    }

    // 如果更新了概率，验证概率总和
    if (req.body.probabilities) {
      const totalProbability = req.body.probabilities.reduce((sum, prob) => sum + prob, 0)
      if (Math.abs(totalProbability - 100) > 0.01) {
        return res.status(400).json({
          code: 400,
          message: '概率总和必须为100%'
        })
      }
    }

    // 更新字段
    const allowedFields = ['title', 'description', 'category', 'items', 'probabilities', 'status', 'maxDraws', 'startTime', 'endTime', 'isActive']
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lottery[field] = req.body[field]
      }
    })

    await lottery.save()

    res.json({
      code: 200,
      message: '抽签活动更新成功',
      data: { lottery }
    })
  } catch (error) {
    console.error('更新抽签失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新抽签失败'
    })
  }
})

// 删除抽签活动
router.delete('/:id', async (req, res) => {
  try {
    const lottery = await Lottery.findById(req.params.id)
    
    if (!lottery) {
      return res.status(404).json({
        code: 404,
        message: '抽签不存在'
      })
    }

    await Lottery.findByIdAndDelete(req.params.id)

    res.json({
      code: 200,
      message: '抽签活动删除成功'
    })
  } catch (error) {
    console.error('删除抽签失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '删除抽签失败'
    })
  }
})

// 获取抽签统计数据
router.get('/:id/stats', async (req, res) => {
  try {
    const lottery = await Lottery.findById(req.params.id)
    
    if (!lottery) {
      return res.status(404).json({
        code: 404,
        message: '抽签不存在'
      })
    }

    // 统计各个奖品的抽中次数
    const records = await LotteryRecord.find({ lotteryId: req.params.id })
    
    const itemStats = {}
    lottery.items.forEach(item => {
      itemStats[item] = 0
    })
    
    records.forEach(record => {
      const item = record.result.item
      if (itemStats[item] !== undefined) {
        itemStats[item]++
      }
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        totalDraws: records.length,
        itemStats,
        lottery
      }
    })
  } catch (error) {
    console.error('获取抽签统计失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取抽签统计失败'
    })
  }
})

module.exports = router
