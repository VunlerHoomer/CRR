const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

// 简单的内存存储来模拟答题记录
const taskRecords = new Map()

// 最简单的测试路由
router.get('/test', (req, res) => {
  res.json({
    code: 200,
    message: '任务路由测试成功',
    data: { timestamp: new Date().toISOString() }
  })
})

// 获取活动区域列表 - 支持用户认证和内存进度显示
router.get('/areas/:activityId', require('../../middleware/auth'), async (req, res) => {
  try {
    const { activityId } = req.params
    const userId = req.user._id
    
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

    // 获取用户在该活动中的所有答题记录（从内存）
    const userRecords = []
    const progressByArea = {}
    
    for (const [key, record] of taskRecords.entries()) {
      if (key.startsWith(`${userId}_${activityId}_`) && record.isCorrect) {
        userRecords.push(record)
        const areaId = record.areaId
        if (!progressByArea[areaId]) {
          progressByArea[areaId] = {
            completedTasks: 0,
            totalPoints: 0
          }
        }
        progressByArea[areaId].completedTasks += 1
        progressByArea[areaId].totalPoints += record.pointsEarned
      }
    }

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
        const previousProgress = progressByArea[previousArea._id.toString()] || { completedTasks: 0 }
        const previousTotalTasks = await Task.countDocuments({
          area: previousArea._id,
          activity: activityId,
          isActive: true
        })
        // 只有当前置区域有任务且全部完成时，当前区域才解锁
        if (previousTotalTasks > 0) {
          isUnlocked = previousProgress.completedTasks === previousTotalTasks
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

// 获取区域任务列表 - 支持用户认证和内存进度显示
router.get('/area/:areaId/tasks', require('../../middleware/auth'), async (req, res) => {
  try {
    const { areaId } = req.params
    const userId = req.user._id
    
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

    // 获取用户的答题记录（从内存）
    const userRecords = []
    const recordMap = {}
    
    for (const [key, record] of taskRecords.entries()) {
      if (key.startsWith(`${userId}_`) && tasks.some(t => t._id.toString() === record.taskId)) {
        userRecords.push(record)
        recordMap[record.taskId] = record
      }
    }

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

// 提交任务答案 - 支持用户认证和内存记录保存
router.post('/:taskId/submit', require('../../middleware/auth'), async (req, res) => {
  try {
    const { taskId } = req.params
    const { answer } = req.body
    const userId = req.user._id
    
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

    // 保存答题记录到内存
    const recordKey = `${userId}_${task.activity}_${task.area}_${taskId}`
    const existingRecord = taskRecords.get(recordKey)
    
    let taskRecord
    if (existingRecord) {
      // 更新现有记录
      taskRecord = {
        ...existingRecord,
        userAnswer: answer,
        isCorrect,
        pointsEarned: isCorrect ? task.points : 0,
        attemptCount: existingRecord.attemptCount + 1,
        errorCount: existingRecord.errorCount + (isCorrect ? 0 : 1),
        submittedAt: new Date().toISOString(),
        completedAt: isCorrect && !existingRecord.completedAt ? new Date().toISOString() : existingRecord.completedAt
      }
    } else {
      // 创建新记录
      taskRecord = {
        userId,
        activityId: task.activity,
        areaId: task.area,
        taskId,
        userAnswer: answer,
        isCorrect,
        pointsEarned: isCorrect ? task.points : 0,
        attemptCount: 1,
        errorCount: isCorrect ? 0 : 1,
        submittedAt: new Date().toISOString(),
        completedAt: isCorrect ? new Date().toISOString() : null
      }
    }
    
    taskRecords.set(recordKey, taskRecord)

    const result = {
      taskId: task._id,
      userAnswer: answer,
      correctAnswer: task.correctAnswer,
      isCorrect,
      points: isCorrect ? task.points : 0,
      feedback,
      taskRecord: {
        id: recordKey,
        attemptCount: taskRecord.attemptCount,
        completedAt: taskRecord.completedAt,
        pointsEarned: taskRecord.pointsEarned
      }
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

// 获取用户进度统计 - 支持用户认证
router.get('/progress/:activityId', require('../../middleware/auth'), async (req, res) => {
  try {
    const { activityId } = req.params
    const userId = req.user._id
    
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接'
      })
    }

    // 从数据库获取区域和任务数据
    const Area = require('../models/Area')
    const Task = require('../models/Task')
    
    // 获取用户统计数据（从内存）
    const userRecords = []
    for (const [key, record] of taskRecords.entries()) {
      if (key.startsWith(`${userId}_${activityId}_`) && record.isCorrect) {
        userRecords.push(record)
      }
    }
    
    const stats = {
      totalTasks: userRecords.length,
      correctTasks: userRecords.filter(r => r.isCorrect).length,
      totalPoints: userRecords.reduce((sum, r) => sum + (r.pointsEarned || 0), 0),
      accuracy: userRecords.length > 0 ? Math.round((userRecords.filter(r => r.isCorrect).length / userRecords.length) * 100) : 0,
      totalAttempts: userRecords.reduce((sum, r) => sum + (r.attemptCount || 0), 0),
      totalErrors: userRecords.reduce((sum, r) => sum + (r.errorCount || 0), 0),
      avgTimeTaken: 0
    }
    
    // 获取区域进度
    const areas = await Area.find({ 
      activity: activityId,
      isActive: true 
    }).sort({ order: 1 })

    const areaProgress = []
    for (const area of areas) {
      const totalTasks = await Task.countDocuments({
        area: area._id,
        activity: activityId,
        isActive: true
      })
      
      const completedRecords = userRecords.filter(record => record.areaId.toString() === area._id.toString())
      
      areaProgress.push({
        areaId: area._id,
        areaName: area.name,
        areaIcon: area.icon || '📍',
        areaColor: area.color || '#409eff',
        progress: {
          completedCount: completedRecords.length,
          totalTasks,
          percentage: totalTasks > 0 ? Math.round((completedRecords.length / totalTasks) * 100) : 0,
          isCompleted: completedRecords.length === totalTasks && totalTasks > 0,
          totalPoints: completedRecords.reduce((sum, record) => sum + (record.pointsEarned || 0), 0)
        }
      })
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        stats,
        areaProgress
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
