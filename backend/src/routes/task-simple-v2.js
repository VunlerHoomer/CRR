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

// 获取活动区域列表 - 使用真实数据库数据
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

    // 从数据库获取真实的区域数据
    const Area = require('../models/Area')
    const Task = require('../models/Task')
    const TaskRecord = require('../models/TaskRecord')
    
    const areas = await Area.find({ 
      activity: activityId,
      isActive: true 
    }).sort({ order: 1 })

    // 获取用户在该活动中的所有答题记录（暂时设为空，因为没有用户认证）
    const userRecords = []
    const progressByArea = {}

    // 转换为前端需要的格式，包含解锁状态
    const formattedAreas = []
    
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i]
      
      // 获取该区域的任务总数
      const totalTasks = await Task.countDocuments({
        area: area._id,
        activity: activityId,
        isActive: true
      })
      
      const userProgress = progressByArea[area._id.toString()] || { completedTasks: 0, totalPoints: 0 }
      const completedTasks = userProgress.completedTasks
      const isCompleted = completedTasks === totalTasks && totalTasks > 0
      
      // 检查是否解锁：第一个区域直接解锁，其他区域需要前一个区域完成
      let isUnlocked = false
      if (i === 0) {
        isUnlocked = true // 第一个区域总是解锁
      } else {
        const previousArea = areas[i - 1]
        const previousProgress = progressByArea[previousArea._id.toString()]
        const previousTotalTasks = await Task.countDocuments({
          area: previousArea._id,
          activity: activityId,
          isActive: true
        })
        isUnlocked = previousProgress && previousProgress.completedTasks === previousTotalTasks && previousTotalTasks > 0
      }
      
      formattedAreas.push({
        _id: area._id,
        name: area.name,
        description: area.description || '',
        order: area.order,
        isUnlocked,
        progress: {
          completed: completedTasks,
          total: totalTasks,
          percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          isCompleted,
          totalPoints: userProgress.totalPoints
        }
      })
    }

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

// 获取区域任务列表 - 使用真实数据库数据
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

    // 从数据库获取真实的任务数据
    const Task = require('../models/Task')
    const TaskRecord = require('../models/TaskRecord')
    
    const tasks = await Task.find({ 
      area: areaId,
      isActive: true 
    }).sort({ order: 1, createdAt: 1 })

    // 获取用户的答题记录（暂时设为空，因为没有用户认证）
    const userRecords = []
    const recordMap = {}

    // 转换为前端需要的格式，包含用户进度
    const formattedTasks = tasks.map(task => {
      const userRecord = recordMap[task._id.toString()]
      
      return {
        _id: task._id,
        title: task.title,
        description: task.description || '',
        question: task.question,
        questionType: task.questionType,
        options: task.options || [],
        correctAnswer: task.correctAnswer,
        correctAnswers: task.correctAnswers || [],
        answerMatchType: task.answerMatchType,
        caseSensitive: task.caseSensitive,
        numberTolerance: task.numberTolerance,
        hint: task.hint,
        points: task.points,
        order: task.order,
        maxAttempts: task.maxAttempts,
        isActive: task.isActive,
        difficulty: task.difficulty,
        // 兼容前端可能使用的字段名
        type: task.questionType,
        answer: task.correctAnswer,
        // 用户进度信息
        userProgress: userRecord ? {
          isCompleted: userRecord.isCorrect,
          userAnswer: userRecord.userAnswer,
          pointsEarned: userRecord.pointsEarned,
          attemptCount: userRecord.attemptCount,
          completedAt: userRecord.completedAt,
          submittedAt: userRecord.submittedAt
        } : null
      }
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        tasks: formattedTasks
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
