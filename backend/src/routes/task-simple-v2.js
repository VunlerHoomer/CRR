const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

// 最简单的测试路由，不需要认证
router.get('/test', (req, res) => {
  res.json({
    code: 200,
    message: '任务路由测试成功',
    data: { timestamp: new Date().toISOString() }
  })
})

// 获取活动区域列表 - 简化版本，暂时不包含解锁逻辑
router.get('/areas/:activityId', (req, res) => {
  try {
    const { activityId } = req.params
    
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接'
      })
    }

    // 暂时返回简单的区域数据
    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        areas: [
          {
            _id: '68e81442c2de63f9e6bde880',
            name: '文庙',
            description: '',
            order: 0,
            isUnlocked: true, // 第一个区域总是解锁
            progress: {
              completed: 0,
              total: 2,
              percentage: 0,
              isCompleted: false,
              totalPoints: 0
            }
          },
          {
            _id: '68e9df65caee8e2d06fa2142',
            name: '桃花坞',
            description: '',
            order: 1,
            isUnlocked: false, // 需要完成第一个区域
            progress: {
              completed: 0,
              total: 2,
              percentage: 0,
              isCompleted: false,
              totalPoints: 0
            }
          },
          {
            _id: '68e9dfbdcaee8e2d06fa2157',
            name: '仓街',
            description: '',
            order: 2,
            isUnlocked: false, // 需要完成第二个区域
            progress: {
              completed: 0,
              total: 2,
              percentage: 0,
              isCompleted: false,
              totalPoints: 0
            }
          }
        ]
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

// 获取用户进度统计 - 简化版本
router.get('/progress/:activityId', (req, res) => {
  try {
    const { activityId } = req.params
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        stats: {
          totalTasks: 6,
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

// 提交任务答案 - 简化版本，暂时不保存到数据库
router.post('/:taskId/submit', (req, res) => {
  try {
    const { taskId } = req.params
    const { answer } = req.body
    
    // 简单的答案比对逻辑
    let isCorrect = false
    let feedback = ''
    
    // 根据任务ID进行简单的答案比对
    if (taskId === '68e8145feccf1de242ad114b') {
      // 任务A1: 问题"111"，答案"11"
      isCorrect = answer === '11'
      feedback = isCorrect ? '回答正确！' : '回答错误。'
    } else if (taskId === '68e94fa6722ab4d4041c990a') {
      // 任务11111: 问题"11111"，答案"111"
      isCorrect = answer === '111'
      feedback = isCorrect ? '回答正确！' : '回答错误。 提示：111'
    } else {
      // 其他任务
      isCorrect = false
      feedback = '任务不存在或答案错误。'
    }

    const result = {
      taskId: taskId,
      userAnswer: answer,
      correctAnswer: isCorrect ? answer : '未知',
      isCorrect,
      points: isCorrect ? 10 : 0,
      feedback
    }

    res.json({
      code: 200,
      message: '提交成功',
      data: result
    })

  } catch (error) {
    console.error('提交答案失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '提交答案失败'
    })
  }
})

// 获取区域任务列表 - 简化版本
router.get('/area/:areaId/tasks', (req, res) => {
  try {
    const { areaId } = req.params
    
    // 根据区域ID返回不同的任务
    let tasks = []
    
    if (areaId === '68e81442c2de63f9e6bde880') {
      // 文庙区域
      tasks = [
        {
          _id: '68e8145feccf1de242ad114b',
          title: 'A1',
          description: '',
          question: '111',
          questionType: 'text',
          options: [],
          correctAnswer: '11',
          points: 10,
          order: 1,
          isActive: true,
          type: 'text',
          answer: '11',
          userProgress: null
        },
        {
          _id: '68e94fa6722ab4d4041c990a',
          title: '11111',
          description: '11111',
          question: '11111',
          questionType: 'text',
          options: [],
          correctAnswer: '111',
          hint: '111',
          points: 10,
          order: 2,
          isActive: true,
          type: 'text',
          answer: '111',
          userProgress: null
        }
      ]
    } else {
      // 其他区域暂时返回空任务列表
      tasks = []
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        tasks: tasks
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
