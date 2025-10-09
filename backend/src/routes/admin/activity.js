const express = require('express')
const Activity = require('../../models/Activity')
const { adminAuth } = require('../../middleware/adminAuth')

const router = express.Router()

// 所有路由都需要管理员权限
router.use(adminAuth)

// 获取所有活动列表（管理员专用）
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 100, status, type } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (status) query.status = status
    if (type) query.activityType = type

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Activity.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取活动列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取活动列表失败'
    })
  }
})

// 获取单个活动详情（管理员专用）
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)

    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: { activity }
    })
  } catch (error) {
    console.error('获取活动详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取活动详情失败'
    })
  }
})

module.exports = router
