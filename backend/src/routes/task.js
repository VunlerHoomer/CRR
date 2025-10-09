const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { body, validationResult } = require('express-validator')
const Task = require('../../models/Task')
const TaskRecord = require('../../models/TaskRecord')
const Area = require('../../models/Area')
const Registration = require('../../models/Registration')

// 获取活动区域列表
router.get('/areas/:activityId', auth, async (req, res) => {
  try {
    const { activityId } = req.params
    const userId = req.user._id

    // 检查用户是否已报名该活动且被批准
    const registration = await Registration.findOne({
      user: userId,
      activity: activityId,
      status: 'approved'
    })

    if (!registration) {
      return res.status(403).json({ 
        code: 403, 
        message: '您未报名该活动或报名未通过审核，无法访问任务列表。' 
      })
    }

    // 获取该活动的所有区域
    const areas = await Area.find({ 
      activity: activityId, 
      isActive: true 
    }).sort({ order: 1 })

    // 获取用户在各区域的进度
    const progressPromises = areas.map(async (area) => {
      const completedCount = await TaskRecord.countDocuments({
        user: userId,
        area: area._id,
        isCorrect: true
      })

      const totalTasks = await Task.countDocuments({
        area: area._id,
        isActive: true
      })

      const isCompleted = completedCount === totalTasks && totalTasks > 0
      
      return {
        ...area.toObject(),
        progress: {
          completed: completedCount,
          total: totalTasks,
          percentage: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
          isCompleted
        }
      }
    })

    const areasWithProgress = await Promise.all(progressPromises)

    res.json({
      code: 200,
      message: '获取成功',
      data: { areas: areasWithProgress }
    })
  } catch (error) {
    console.error('获取区域列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取区域列表失败'
    })
  }
})

// 获取区域任务列表
router.get('/area/:areaId/tasks', auth, async (req, res) => {
  try {
    const { areaId } = req.params
    const userId = req.user._id

    // 获取区域信息
    const area = await Area.findById(areaId)
    if (!area) {
      return res.status(404).json({ code: 404, message: '区域不存在' })
    }

    // 检查用户权限
    const registration = await Registration.findOne({
      user: userId,
      activity: area.activity,
      status: 'approved'
    })

    if (!registration) {
      return res.status(403).json({ 
        code: 403, 
        message: '您没有权限访问该区域的任务。' 
      })
    }

    // 获取该区域的所有任务
    const tasks = await Task.find({ 
      area: areaId, 
      isActive: true 
    }).sort({ order: 1 })

    // 获取用户的答题记录
    const records = await TaskRecord.find({
      user: userId,
      area: areaId
    })

    // 合并任务和记录信息
    const tasksWithRecords = tasks.map(task => {
      const record = records.find(r => r.task.toString() === task._id.toString())
      return {
        ...task.toObject(),
        userRecord: record ? {
          isCorrect: record.isCorrect,
          userAnswer: record.userAnswer,
          attemptCount: record.attemptCount,
          submittedAt: record.submittedAt,
          completedAt: record.completedAt,
          pointsEarned: record.pointsEarned
        } : null
      }
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        area: {
          ...area.toObject(),
          totalTasks: tasks.length
        },
        tasks: tasksWithRecords
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

// 获取单个任务详情
router.get('/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = req.user._id

    // 获取任务信息
    const task = await Task.findById(taskId)
      .populate('area', 'name color')
      .populate('activity', 'title')
    
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' })
    }

    // 检查用户权限
    const registration = await Registration.findOne({
      user: userId,
      activity: task.activity._id,
      status: 'approved'
    })

    if (!registration) {
      return res.status(403).json({ 
        code: 403, 
        message: '您没有权限访问该任务。' 
      })
    }

    // 检查是否可以访问该任务（按顺序解锁）
    const canAccess = await TaskRecord.canAccessTask(userId, task.activity._id, task.area._id, taskId)
    if (!canAccess) {
      return res.status(403).json({ 
        code: 403, 
        message: '请先完成前置任务。' 
      })
    }

    // 获取用户答题记录
    const record = await TaskRecord.findOne({
      user: userId,
      task: taskId
    })

    // 如果已经完成，直接返回结果
    if (record && record.isCorrect) {
      return res.json({
        code: 200,
        message: '获取成功',
        data: { 
          task: {
            ...task.toObject(),
            isCompleted: true,
            userRecord: {
              isCorrect: record.isCorrect,
              userAnswer: record.userAnswer,
              attemptCount: record.attemptCount,
              submittedAt: record.submittedAt,
              completedAt: record.completedAt,
              pointsEarned: record.pointsEarned
            }
          }
        }
      })
    }

    // 隐藏正确答案，只返回任务信息
    const taskForUser = {
      ...task.toObject(),
      correctAnswer: undefined,
      correctAnswers: undefined,
      isCompleted: false,
      userRecord: record ? {
        isCorrect: record.isCorrect,
        attemptCount: record.attemptCount,
        submittedAt: record.submittedAt,
        pointsEarned: record.pointsEarned
      } : null
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: { task: taskForUser }
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取任务详情失败'
    })
  }
})

// 提交任务答案
router.post('/:taskId/submit', auth, [
  body('answer').notEmpty().withMessage('答案不能为空')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: 400, message: errors.array()[0].msg })
  }

  try {
    const { taskId } = req.params
    const { answer } = req.body
    const userId = req.user._id

    // 获取任务信息
    const task = await Task.findById(taskId).populate('area activity')
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' })
    }

    // 检查用户权限
    const registration = await Registration.findOne({
      user: userId,
      activity: task.activity._id,
      status: 'approved'
    })

    if (!registration) {
      return res.status(403).json({ 
        code: 403, 
        message: '您没有权限提交该任务答案。' 
      })
    }

    // 检查是否可以访问该任务
    const canAccess = await TaskRecord.canAccessTask(userId, task.activity._id, task.area._id, taskId)
    if (!canAccess) {
      return res.status(403).json({ 
        code: 403, 
        message: '请先完成前置任务。' 
      })
    }

    // 查找或创建答题记录
    let record = await TaskRecord.findOne({ user: userId, task: taskId })
    
    if (!record) {
      record = new TaskRecord({
        user: userId,
        activity: task.activity._id,
        area: task.area._id,
        task: taskId,
        startTime: new Date()
      })
    }

    // 检查是否已经完成
    if (record.isCorrect) {
      return res.status(400).json({ 
        code: 400, 
        message: '该任务已完成，无需重复提交。' 
      })
    }

    // 检查尝试次数限制
    if (task.maxAttempts > 0 && record.attemptCount >= task.maxAttempts) {
      return res.status(400).json({ 
        code: 400, 
        message: `已达到最大尝试次数 ${task.maxAttempts} 次。` 
      })
    }

    // 验证答案
    const isCorrect = task.validateAnswer(answer)
    
    // 更新记录
    record.userAnswer = answer
    record.attemptCount += 1
    record.submittedAt = new Date()
    
    if (record.startTime) {
      record.timeTaken = Math.floor((new Date() - record.startTime) / 1000)
    }

    if (isCorrect) {
      record.isCorrect = true
      record.pointsEarned = task.points
      record.completedAt = new Date()
    } else {
      record.errorCount += 1
    }

    await record.save()

    // 获取下一个任务
    let nextTask = null
    if (isCorrect) {
      nextTask = await TaskRecord.getNextTask(userId, task.activity._id, task.area._id)
    }

    res.json({
      code: 200,
      message: isCorrect ? '答案正确！' : '答案错误，请重试。',
      data: {
        isCorrect,
        pointsEarned: isCorrect ? task.points : 0,
        attemptCount: record.attemptCount,
        nextTask: nextTask ? {
          _id: nextTask._id,
          title: nextTask.title,
          order: nextTask.order
        } : null,
        isAreaCompleted: isCorrect && !nextTask
      }
    })
  } catch (error) {
    console.error('提交答案失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '提交答案失败'
    })
  }
})

// 获取用户进度统计
router.get('/progress/:activityId', auth, async (req, res) => {
  try {
    const { activityId } = req.params
    const userId = req.user._id

    // 检查用户权限
    const registration = await Registration.findOne({
      user: userId,
      activity: activityId,
      status: 'approved'
    })

    if (!registration) {
      return res.status(403).json({ 
        code: 403, 
        message: '您没有权限查看该活动的进度。' 
      })
    }

    // 获取用户统计数据
    const stats = await TaskRecord.getUserStats(userId, activityId)
    
    // 获取区域进度
    const progressByArea = await TaskRecord.getUserProgress(userId, activityId)
    
    // 获取所有区域信息
    const areas = await Area.find({ 
      activity: activityId, 
      isActive: true 
    }).sort({ order: 1 })

    // 合并区域信息和进度
    const areaProgress = areas.map(area => {
      const progress = progressByArea[area._id.toString()]
      const totalTasks = Task.countDocuments({ area: area._id, isActive: true })
      
      return {
        ...area.toObject(),
        progress: progress ? {
          completedTasks: progress.completedTasks,
          completedCount: progress.completedCount,
          totalPoints: progress.totalPoints,
          isCompleted: progress.completedCount === totalTasks
        } : {
          completedTasks: [],
          completedCount: 0,
          totalPoints: 0,
          isCompleted: false
        }
      }
    })

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
