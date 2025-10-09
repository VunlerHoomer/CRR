const express = require('express')
const { body, validationResult } = require('express-validator')
const Task = require('../models/Task')
const TaskRecord = require('../models/TaskRecord')
const Activity = require('../models/Activity')
const Registration = require('../models/Registration')
const auth = require('../middleware/auth')

const router = express.Router()

// 获取活动的任务列表（用户端）
router.get('/activity/:activityId', auth, async (req, res) => {
  try {
    const { activityId } = req.params

    // 检查用户是否已报名该活动
    const registration = await Registration.findOne({
      user: req.user._id,
      activity: activityId,
      status: 'approved'
    })

    if (!registration) {
      return res.status(403).json({
        code: 403,
        message: '您未报名该活动或报名未通过审核'
      })
    }

    // 获取活动的任务列表
    const tasks = await Task.find({ 
      activity: activityId, 
      isActive: true 
    }).sort({ order: 1, createdAt: -1 })

    // 获取用户的任务完成记录
    const taskRecords = await TaskRecord.find({
      user: req.user._id,
      task: { $in: tasks.map(t => t._id) }
    })

    // 合并任务和记录信息
    const tasksWithProgress = tasks.map(task => {
      const record = taskRecords.find(r => r.task.toString() === task._id.toString())
      return {
        ...task.toJSON(),
        userProgress: record ? {
          status: record.status,
          attempts: record.completion.attempts,
          score: record.completion.score,
          completedAt: record.completion.completedAt,
          canRetry: record.status !== 'completed' && record.completion.attempts < task.maxAttempts
        } : {
          status: 'not_started',
          attempts: 0,
          score: 0,
          completedAt: null,
          canRetry: true
        }
      }
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: { tasks: tasksWithProgress }
    })
  } catch (error) {
    console.error('获取活动任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取活动任务失败'
    })
  }
})

// 开始任务
router.post('/:taskId/start', auth, async (req, res) => {
  try {
    const { taskId } = req.params

    // 获取任务信息
    const task = await Task.findById(taskId).populate('activity')
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在'
      })
    }

    // 检查用户是否已报名该活动
    const registration = await Registration.findOne({
      user: req.user._id,
      activity: task.activity._id,
      status: 'approved'
    })

    if (!registration) {
      return res.status(403).json({
        code: 403,
        message: '您未报名该活动或报名未通过审核'
      })
    }

    // 查找或创建任务记录
    let taskRecord = await TaskRecord.findOne({
      user: req.user._id,
      task: taskId
    })

    if (!taskRecord) {
      taskRecord = new TaskRecord({
        user: req.user._id,
        task: taskId,
        activity: task.activity._id,
        status: 'in_progress'
      })
      await taskRecord.save()
    } else if (taskRecord.status === 'completed') {
      return res.status(400).json({
        code: 400,
        message: '该任务已完成'
      })
    } else if (taskRecord.completion.attempts >= task.maxAttempts) {
      return res.status(400).json({
        code: 400,
        message: '已达到最大尝试次数'
      })
    } else {
      taskRecord.status = 'in_progress'
      await taskRecord.save()
    }

    res.json({
      code: 200,
      message: '任务开始成功',
      data: { 
        task: {
          ...task.toJSON(),
          userProgress: {
            status: taskRecord.status,
            attempts: taskRecord.completion.attempts,
            score: taskRecord.completion.score,
            completedAt: taskRecord.completion.completedAt,
            canRetry: taskRecord.status !== 'completed' && taskRecord.completion.attempts < task.maxAttempts
          }
        }
      }
    })
  } catch (error) {
    console.error('开始任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '开始任务失败'
    })
  }
})

// 提交任务答案
router.post('/:taskId/submit', [
  auth,
  body('answers').optional().isArray().withMessage('答案格式错误'),
  body('location').optional().isObject().withMessage('位置信息格式错误'),
  body('photos').optional().isArray().withMessage('照片格式错误'),
  body('textContent').optional().isString().withMessage('文本内容格式错误'),
  body('customResult').optional().isObject().withMessage('自定义结果格式错误')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { taskId } = req.params
    const { answers, location, photos, textContent, customResult } = req.body

    // 获取任务信息
    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在'
      })
    }

    // 获取任务记录
    const taskRecord = await TaskRecord.findOne({
      user: req.user._id,
      task: taskId
    })

    if (!taskRecord) {
      return res.status(404).json({
        code: 404,
        message: '任务记录不存在'
      })
    }

    if (taskRecord.status === 'completed') {
      return res.status(400).json({
        code: 400,
        message: '该任务已完成'
      })
    }

    if (taskRecord.completion.attempts >= task.maxAttempts) {
      return res.status(400).json({
        code: 400,
        message: '已达到最大尝试次数'
      })
    }

    // 增加尝试次数
    await taskRecord.addAttempt()

    // 根据任务类型处理提交结果
    let score = 0
    let details = {}

    switch (task.type) {
      case 'quiz':
        if (answers && task.config.quiz && task.config.quiz.questions) {
          details.answers = []
          for (let i = 0; i < answers.length; i++) {
            const userAnswer = answers[i]
            const question = task.config.quiz.questions[i]
            const isCorrect = userAnswer === question.correctAnswer
            const points = isCorrect ? (question.points || 10) : 0
            
            details.answers.push({
              question: question.question,
              userAnswer,
              correctAnswer: question.correctAnswer,
              isCorrect,
              points
            })
            
            score += points
          }
        }
        break

      case 'location':
        if (location) {
          details.location = {
            latitude: location.latitude,
            longitude: location.longitude,
            checkedInAt: new Date()
          }
          score = task.points // 位置签到直接给满分
        }
        break

      case 'photo':
        if (photos) {
          details.photos = photos.map(photo => ({
            url: photo.url,
            description: photo.description,
            uploadedAt: new Date()
          }))
          score = task.points // 照片任务直接给满分
        }
        break

      case 'text':
        if (textContent) {
          details.textContent = textContent
          score = task.points // 文本任务直接给满分
        }
        break

      case 'custom':
        if (customResult) {
          details.customResult = customResult
          score = task.points // 自定义任务直接给满分
        }
        break
    }

    // 完成任务
    if (score > 0) {
      await taskRecord.complete(score, details)
    } else {
      await taskRecord.markAsFailed()
    }

    res.json({
      code: 200,
      message: '任务提交成功',
      data: {
        score,
        status: taskRecord.status,
        completed: taskRecord.status === 'completed'
      }
    })
  } catch (error) {
    console.error('提交任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '提交任务失败'
    })
  }
})

// 获取用户的任务完成情况
router.get('/my-progress/:activityId', auth, async (req, res) => {
  try {
    const { activityId } = req.params

    // 检查用户是否已报名该活动
    const registration = await Registration.findOne({
      user: req.user._id,
      activity: activityId,
      status: 'approved'
    })

    if (!registration) {
      return res.status(403).json({
        code: 403,
        message: '您未报名该活动或报名未通过审核'
      })
    }

    // 获取任务记录
    const taskRecords = await TaskRecord.find({
      user: req.user._id,
      activity: activityId
    }).populate('task', 'name description points type')

    const progress = {
      totalTasks: 0,
      completedTasks: 0,
      totalScore: 0,
      completionRate: 0,
      tasks: taskRecords.map(record => ({
        taskId: record.task._id,
        taskName: record.task.name,
        taskDescription: record.task.description,
        taskPoints: record.task.points,
        taskType: record.task.type,
        status: record.status,
        attempts: record.completion.attempts,
        score: record.completion.score,
        completedAt: record.completion.completedAt
      }))
    }

    // 获取活动总任务数
    progress.totalTasks = await Task.countDocuments({
      activity: activityId,
      isActive: true
    })

    progress.completedTasks = taskRecords.filter(r => r.status === 'completed').length
    progress.totalScore = taskRecords.reduce((sum, r) => sum + r.completion.score, 0)
    progress.completionRate = progress.totalTasks > 0 ? 
      (progress.completedTasks / progress.totalTasks * 100).toFixed(1) : 0

    res.json({
      code: 200,
      message: '获取成功',
      data: { progress }
    })
  } catch (error) {
    console.error('获取任务进度失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取任务进度失败'
    })
  }
})

module.exports = router