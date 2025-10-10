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

// 提交任务答案
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

    // 获取任务信息
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

    // 答案比对逻辑
    let isCorrect = false
    let feedback = ''

    if (task.questionType === 'text') {
      // 文本题答案比对
      const userAnswer = answer?.trim().toLowerCase()
      const correctAnswer = task.correctAnswer?.trim().toLowerCase()
      
      if (task.answerMatchType === 'exact') {
        // 精确匹配
        isCorrect = userAnswer === correctAnswer
      } else if (task.answerMatchType === 'contains') {
        // 包含匹配
        isCorrect = correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer)
      } else {
        // 默认精确匹配
        isCorrect = userAnswer === correctAnswer
      }
    } else if (task.questionType === 'choice') {
      // 选择题答案比对
      isCorrect = task.correctAnswers.includes(answer)
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

    // 记录答题结果（暂时不保存到数据库，后续可以添加TaskRecord）
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
      description: task.description,
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
      answer: task.correctAnswer
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

module.exports = router
