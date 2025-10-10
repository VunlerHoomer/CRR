const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

// 最简单的测试路由，不需要认证
router.get('/test', (req, res) => {
  res.json({
    code: 200,
    message: '任务路由调试成功',
    data: { timestamp: new Date().toISOString() }
  })
})

// 获取活动区域列表 - 从数据库获取真实数据
router.get('/areas/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params
    
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接'
      })
    }

    const Area = require('../models/Area')
    const areas = await Area.find({ 
      activity: activityId,
      isActive: true 
    }).sort({ order: 1 })

    // 转换为前端需要的格式
    const formattedAreas = areas.map(area => ({
      _id: area._id,
      name: area.name,
      description: area.description,
      order: area.order,
      progress: {
        completed: 0, // 暂时设为0，后续可以计算真实进度
        total: 3,     // 暂时设为3，后续可以计算真实任务数
        percentage: 0,
        isCompleted: false
      }
    }))

    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        areas: formattedAreas
      }
    })
  } catch (error) {
    console.error('获取区域列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取区域列表失败'
    })
  }
})

// 获取用户进度统计 - 调试版本
router.get('/progress/:activityId', (req, res) => {
  try {
    const { activityId } = req.params
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        stats: {
          totalTasks: 3,
          correctTasks: 0,
          totalPoints: 0,
          accuracy: 0
        },
        areaProgress: []
      }
    })
  } catch (error) {
    console.error('获取用户进度失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户进度失败'
    })
  }
})

module.exports = router
