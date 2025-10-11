const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

// 最简单的测试路由
router.get('/test', (req, res) => {
  res.json({
    code: 200,
    message: '任务路由测试成功',
    data: { timestamp: new Date().toISOString() }
  })
})

// 获取活动区域列表 - 简化版本
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
    
    const areas = await Area.find({ 
      activity: activityId,
      isActive: true 
    }).sort({ order: 1 })

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
      
      // 检查是否解锁：第一个区域直接解锁，其他区域需要前一个区域完成
      let isUnlocked = false
      if (i === 0) {
        isUnlocked = true // 第一个区域总是解锁
      } else {
        const previousArea = areas[i - 1]
        const previousTotalTasks = await Task.countDocuments({
          area: previousArea._id,
          activity: activityId,
          isActive: true
        })
        // 只有当前置区域有任务且全部完成时，当前区域才解锁
        if (previousTotalTasks > 0) {
          // 暂时设为false，因为没有用户认证
          isUnlocked = false
        } else {
          // 如果前置区域没有任务，当前区域保持锁定状态
          isUnlocked = false
        }
      }
      
      formattedAreas.push({
        _id: area._id,
        name: area.name,
        description: area.description || '',
        order: area.order,
        isUnlocked,
        progress: {
          completed: 0, // 暂时设为0
          total: totalTasks,
          percentage: 0,
          isCompleted: false,
          totalPoints: 0
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

// 获取区域任务列表 - 简化版本
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
    
    const tasks = await Task.find({ 
      area: areaId,
      isActive: true 
    }).sort({ order: 1, createdAt: 1 })

    // 转换为前端需要的格式
    const formattedTasks = tasks.map(task => ({
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
      // 用户进度信息（暂时设为null）
      userProgress: null
    }))

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

// 提交任务答案 - 简化版本，暂时不保存记录
router.post('/:taskId/submit', async (req, res) => {
  try {
    const { taskId } = req.params
    const { answer } = req.body
    
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接'
      })
    }

    // 从数据库获取任务信息
    const Task = require('../models/Task')
    const task = await Task.findById(taskId)
    
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在'
      })
    }

    if (!task.isActive) {
      return res.status(400).json({
        code: 400,
        message: '任务已停用'
      })
    }

    // 答案验证逻辑
    let isCorrect = false
    let feedback = ''

    if (task.questionType === 'text') {
      const userAnswer = String(answer || '').trim()
      const correctAnswer = String(task.correctAnswer || '').trim()
      
      if (task.answerMatchType === 'exact') {
        // 精确匹配
        isCorrect = userAnswer === correctAnswer
      } else if (task.answerMatchType === 'contains') {
        // 包含匹配
        isCorrect = userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)
      } else if (task.answerMatchType === 'number') {
        // 数字匹配
        const userNum = parseFloat(userAnswer)
        const correctNum = parseFloat(correctAnswer)
        if (!isNaN(userNum) && !isNaN(correctNum)) {
          if (task.numberTolerance > 0) {
            isCorrect = Math.abs(userNum - correctNum) <= task.numberTolerance
          } else {
            isCorrect = userNum === correctNum
          }
        }
      } else {
        // 默认精确匹配
        isCorrect = userAnswer === correctAnswer
      }
      
      // 大小写处理
      if (!task.caseSensitive && !isCorrect) {
        isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase()
      }
    }

    // 生成反馈信息
    if (isCorrect) {
      feedback = '回答正确！'
    } else {
      feedback = '回答错误。'
      if (task.hint) {
        feedback += ` 提示：${task.hint}`
      }
    }

    const result = {
      taskId: task._id,
      userAnswer: answer,
      correctAnswer: task.correctAnswer,
      isCorrect,
      points: isCorrect ? task.points : 0,
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

// 获取用户进度统计 - 简化版本
router.get('/progress/:activityId', (req, res) => {
  try {
    const { activityId } = req.params
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        stats: {
          totalTasks: 0,
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
