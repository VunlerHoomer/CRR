const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

// 调试路由 - 查看数据库状态
router.get('/areas', async (req, res) => {
  try {
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接',
        connectionState: mongoose.connection.readyState
      })
    }

    const Area = require('../models/Area')
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
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接',
        connectionState: mongoose.connection.readyState
      })
    }

    const Activity = require('../models/Activity')
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
