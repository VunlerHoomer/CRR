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

// 获取区域任务列表
router.get('/area/:areaId/tasks', async (req, res) => {
  try {
    const { areaId } = req.params
    
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接'
      })
    }

    // 暂时返回模拟的任务数据
    // 后续可以从数据库中的Task模型获取真实数据
    const mockTasks = [
      {
        _id: 'task-1',
        area: areaId,
        type: 'choice',
        question: '这是一个测试选择题',
        description: '请选择正确答案',
        options: ['选项A', '选项B', '选项C', '选项D'],
        answer: '选项A',
        points: 10,
        order: 1,
        isActive: true
      },
      {
        _id: 'task-2',
        area: areaId,
        type: 'text',
        question: '这是一个测试填空题',
        description: '请填写正确答案',
        answer: '正确答案',
        points: 15,
        order: 2,
        isActive: true
      }
    ]

    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        tasks: mockTasks
      }
    })
  } catch (error) {
    console.error('获取区域任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取区域任务失败'
    })
  }
})

module.exports = router
