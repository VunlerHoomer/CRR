const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

// 测试路由
router.get('/test', (req, res) => {
  res.json({
    code: 200,
    message: '数据库任务路由测试成功',
    data: { timestamp: new Date().toISOString() }
  })
})

// 获取活动区域列表 - 使用数据库存储
router.get('/areas/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params
    const userId = req.query.userId || req.headers['x-user-id']
    
    console.log('🔍 获取区域列表:', { activityId, userId })
    
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

    // 获取用户在该活动中的所有答题记录（从数据库）
    let userRecords = []
    let progressByArea = {}
    
    if (userId && userId !== 'undefined' && userId !== 'null') {
      console.log('🔍 查询用户答题记录:', { userId, activityId })
      
      userRecords = await TaskRecord.find({ 
        user: userId,
        activity: activityId,
        isCorrect: true
      }).populate('area task')
      
      console.log('📊 找到答题记录:', userRecords.length, '条')
      
      // 按区域分组统计
      userRecords.forEach(record => {
        const areaId = record.area._id.toString()
        if (!progressByArea[areaId]) {
          progressByArea[areaId] = {
            completedTasks: 0,
            totalPoints: 0
          }
        }
        progressByArea[areaId].completedTasks += 1
        progressByArea[areaId].totalPoints += record.pointsEarned
      })
      
      console.log('📊 区域进度统计:', progressByArea)
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

    console.log('✅ 区域列表生成完成:', formattedAreas.length, '个区域')

    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        areas: formattedAreas
      }
    })
  } catch (error) {
    console.error('❌ 获取区域列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取区域列表失败'
    })
  }
})

// 获取区域任务列表 - 使用数据库存储
router.get('/area/:areaId/tasks', async (req, res) => {
  try {
    const { areaId } = req.params
    const userId = req.query.userId || req.headers['x-user-id']
    
    console.log('🔍 获取区域任务:', { areaId, userId })
    
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

    // 获取用户的答题记录（从数据库）
    let userRecords = []
    const recordMap = {}
    
    if (userId && userId !== 'undefined' && userId !== 'null') {
      console.log('🔍 查询用户任务答题记录:', { userId, areaId })
      
      userRecords = await TaskRecord.find({
        user: userId,
        task: { $in: tasks.map(t => t._id) }
      }).populate('task')
      
      console.log('📊 找到任务答题记录:', userRecords.length, '条')
      
      userRecords.forEach(record => {
        recordMap[record.task._id.toString()] = record
      })
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
        userRecord: userRecord ? {
          isCorrect: userRecord.isCorrect,
          userAnswer: userRecord.userAnswer,
          pointsEarned: userRecord.pointsEarned,
          attemptCount: userRecord.attemptCount,
          completedAt: userRecord.completedAt,
          submittedAt: userRecord.submittedAt,
          timeTaken: userRecord.timeTaken,
          errorCount: userRecord.errorCount
        } : null,
        userProgress: userRecord ? {
          isCompleted: userRecord.isCorrect,
          userAnswer: userRecord.userAnswer,
          pointsEarned: userRecord.pointsEarned,
          attemptCount: userRecord.attemptCount,
          completedAt: userRecord.completedAt,
          submittedAt: userRecord.submittedAt,
          timeTaken: userRecord.timeTaken,
          errorCount: userRecord.errorCount
        } : null
      }
    })

    console.log('✅ 任务列表生成完成:', formattedTasks.length, '个任务')

    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        tasks: formattedTasks
      }
    })
  } catch (error) {
    console.error('❌ 获取区域任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取区域任务失败'
    })
  }
})

// 提交任务答案 - 使用数据库存储
router.post('/:taskId/submit', async (req, res) => {
  try {
    const { taskId } = req.params
    const { answer, userId } = req.body
    
    console.log('🔍 提交答案:', { taskId, userId, answer })
    
    // 如果没有提供userId，返回错误
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({
        code: 400,
        message: '用户ID不能为空'
      })
    }
    
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接'
      })
    }

    // 从数据库获取任务信息
    const Task = require('../models/Task')
    const TaskRecord = require('../models/TaskRecord')
    const User = require('../models/User')
    
    // 验证用户是否存在
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }
    
    const task = await Task.findById(taskId).populate('area activity')
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
      
      console.log('🔍 答案验证:', {
        userAnswer,
        correctAnswer,
        answerMatchType: task.answerMatchType,
        caseSensitive: task.caseSensitive
      })
      
      if (task.answerMatchType === 'exact') {
        // 精确匹配
        isCorrect = userAnswer === correctAnswer
        if (!isCorrect && !task.caseSensitive) {
          isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase()
        }
      } else if (task.answerMatchType === 'contains') {
        // 包含匹配 - 更严格的逻辑
        if (task.caseSensitive) {
          // 大小写敏感：用户答案必须包含正确答案
          isCorrect = userAnswer.includes(correctAnswer)
        } else {
          // 大小写不敏感：用户答案必须包含正确答案
          isCorrect = userAnswer.toLowerCase().includes(correctAnswer.toLowerCase())
        }
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
        if (!isCorrect && !task.caseSensitive) {
          isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase()
        }
      }
      
      console.log('✅ 验证结果:', { isCorrect, userAnswer, correctAnswer })
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

    // 保存或更新答题记录到数据库
    let taskRecord = await TaskRecord.findOne({
      user: userId,
      task: taskId
    })

    const now = new Date()
    const pointsEarned = isCorrect ? task.points : 0

    if (taskRecord) {
      // 更新现有记录
      taskRecord.userAnswer = answer
      taskRecord.isCorrect = isCorrect
      taskRecord.pointsEarned = pointsEarned
      taskRecord.attemptCount += 1
      taskRecord.errorCount += isCorrect ? 0 : 1
      taskRecord.submittedAt = now
      
      if (isCorrect && !taskRecord.completedAt) {
        taskRecord.completedAt = now
        // 计算用时
        if (taskRecord.startTime) {
          taskRecord.timeTaken = Math.floor((now - taskRecord.startTime) / 1000)
        }
      }
      
      await taskRecord.save()
      console.log('✅ 更新答题记录:', taskRecord._id)
    } else {
      // 创建新记录
      taskRecord = new TaskRecord({
        user: userId,
        activity: task.activity._id,
        area: task.area._id,
        task: taskId,
        userAnswer: answer,
        isCorrect,
        pointsEarned,
        attemptCount: 1,
        errorCount: isCorrect ? 0 : 1,
        submittedAt: now,
        completedAt: isCorrect ? now : null,
        startTime: now
      })
      
      await taskRecord.save()
      console.log('✅ 创建答题记录:', taskRecord._id)
    }

    // 更新用户积分
    if (isCorrect && pointsEarned > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { points: pointsEarned }
      })
      console.log('✅ 更新用户积分:', pointsEarned)
    }

    const result = {
      taskId: task._id,
      userAnswer: answer,
      correctAnswer: task.correctAnswer,
      isCorrect,
      points: pointsEarned,
      feedback,
      taskRecord: {
        id: taskRecord._id,
        attemptCount: taskRecord.attemptCount,
        completedAt: taskRecord.completedAt,
        pointsEarned: taskRecord.pointsEarned,
        timeTaken: taskRecord.timeTaken
      }
    }

    console.log('✅ 答案提交完成:', result)

    res.json({
      code: 200,
      message: '提交成功',
      data: result
    })

  } catch (error) {
    console.error('❌ 提交答案失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '提交答案失败'
    })
  }
})

// 获取用户进度统计 - 使用数据库存储
router.get('/progress/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params
    const userId = req.query.userId || req.headers['x-user-id']
    
    console.log('🔍 获取用户进度:', { activityId, userId })
    
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接'
      })
    }

    // 获取用户统计数据（从数据库）
    const TaskRecord = require('../models/TaskRecord')
    const Area = require('../models/Area')
    const Task = require('../models/Task')
    
    let stats = {
      totalTasks: 0,
      correctTasks: 0,
      totalPoints: 0,
      accuracy: 0,
      totalAttempts: 0,
      totalErrors: 0,
      avgTimeTaken: 0
    }
    
    let areaProgress = []
    
    if (userId && userId !== 'undefined' && userId !== 'null') {
      // 获取用户统计数据
      const userRecords = await TaskRecord.find({
        user: userId,
        activity: activityId
      }).populate('task')
      
      const correctRecords = userRecords.filter(r => r.isCorrect)
      
      stats = {
        totalTasks: userRecords.length,
        correctTasks: correctRecords.length,
        totalPoints: correctRecords.reduce((sum, r) => sum + (r.pointsEarned || 0), 0),
        accuracy: userRecords.length > 0 ? Math.round((correctRecords.length / userRecords.length) * 100) : 0,
        totalAttempts: userRecords.reduce((sum, r) => sum + (r.attemptCount || 0), 0),
        totalErrors: userRecords.reduce((sum, r) => sum + (r.errorCount || 0), 0),
        avgTimeTaken: correctRecords.length > 0 ? Math.round(correctRecords.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / correctRecords.length) : 0
      }
      
      // 获取区域进度
      const areas = await Area.find({ 
        activity: activityId,
        isActive: true 
      }).sort({ order: 1 })

      for (const area of areas) {
        const totalTasks = await Task.countDocuments({
          area: area._id,
          activity: activityId,
          isActive: true
        })
        
        const completedRecords = userRecords.filter(record => 
          record.task.area.toString() === area._id.toString() && record.isCorrect
        )
        
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
    }
    
    console.log('✅ 用户进度统计完成:', stats)
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        stats,
        areaProgress
      }
    })
  } catch (error) {
    console.error('❌ 获取用户进度失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户进度失败'
    })
  }
})

module.exports = router
