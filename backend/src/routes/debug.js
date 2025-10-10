const express = require('express')
const router = express.Router()
const Area = require('../models/Area')
const Activity = require('../models/Activity')

// 调试路由 - 查看数据库状态
router.get('/areas', async (req, res) => {
  try {
    const areas = await Area.find().populate('activity', 'title')
    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        areas,
        count: areas.length
      }
    })
  } catch (error) {
    console.error('获取区域失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取区域失败'
    })
  }
})

router.get('/activities', async (req, res) => {
  try {
    const activities = await Activity.find()
    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        activities,
        count: activities.length
      }
    })
  } catch (error) {
    console.error('获取活动失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取活动失败'
    })
  }
})

module.exports = router
