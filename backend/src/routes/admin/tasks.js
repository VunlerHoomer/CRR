const express = require('express')
const { body, validationResult } = require('express-validator')
const Task = require('../../models/Task')
const TaskRecord = require('../../models/TaskRecord')
const Activity = require('../../models/Activity')
const { adminAuth } = require('../../middleware/adminAuth')

const router = express.Router()

// 获取任务列表
router.get('/list', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      activityId = '', 
      type = '', 
      difficulty = '',
      isActive = ''
    } = req.query

    const skip = (page - 1) * limit

    // 构建查询条件
    const query = {}
    if (activityId) query.activity = activityId
    if (type) query.type = type
    if (difficulty) query.difficulty = difficulty
    if (isActive !== '') query.isActive = isActive === 'true'

    // 获取任务列表
    const tasks = await Task.find(query)
      .populate('activity', 'title')
      .populate('createdBy', 'username')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    // 获取任务统计信息
    const tasksWithStats = await Promise.all(tasks.map(async (task) => {
      const totalAttempts = await TaskRecord.countDocuments({ task: task._id })
      const completedCount = await TaskRecord.countDocuments({ 
        task: task._id, 
        status: 'completed' 
      })
      const completionRate = totalAttempts > 0 ? (completedCount / totalAttempts * 100).toFixed(1) : 0

      return {
        ...task.toJSON(),
        stats: {
          totalAttempts,
          completedCount,
          completionRate: parseFloat(completionRate)
        }
      }
    }))

    const total = await Task.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        tasks: tasksWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取任务列表失败'
    })
  }
})

// 获取任务详情
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('activity', 'title description')
      .populate('createdBy', 'username')

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在'
      })
    }

    // 获取任务统计信息
    const totalAttempts = await TaskRecord.countDocuments({ task: task._id })
    const completedCount = await TaskRecord.countDocuments({ 
      task: task._id, 
      status: 'completed' 
    })
    const completionRate = totalAttempts > 0 ? (completedCount / totalAttempts * 100).toFixed(1) : 0

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        task: {
          ...task.toJSON(),
          stats: {
            totalAttempts,
            completedCount,
            completionRate: parseFloat(completionRate)
          }
        }
      }
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取任务详情失败'
    })
  }
})

// 创建任务
router.post('/create', [
  adminAuth,
  body('activity').isMongoId().withMessage('活动ID无效'),
  body('name').notEmpty().withMessage('任务名称不能为空'),
  body('description').notEmpty().withMessage('任务描述不能为空'),
  body('type').isIn(['quiz', 'location', 'photo', 'text', 'custom']).withMessage('任务类型无效'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('任务难度无效'),
  body('area').notEmpty().withMessage('任务区域不能为空'),
  body('points').isInt({ min: 1 }).withMessage('任务积分必须大于0')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const {
      activity,
      name,
      description,
      type,
      difficulty,
      points,
      maxAttempts = 3,
      area,
      order = 0,
      config = {}
    } = req.body

    // 检查活动是否存在
    const activityExists = await Activity.findById(activity)
    if (!activityExists) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }

    // 创建任务
    const task = new Task({
      activity,
      name,
      description,
      type,
      difficulty,
      points,
      maxAttempts,
      area,
      order,
      config,
      createdBy: req.admin._id
    })

    await task.save()

    res.status(201).json({
      code: 200,
      message: '任务创建成功',
      data: { task }
    })
  } catch (error) {
    console.error('创建任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '创建任务失败'
    })
  }
})

// 更新任务
router.put('/:id', [
  adminAuth,
  body('name').optional().notEmpty().withMessage('任务名称不能为空'),
  body('description').optional().notEmpty().withMessage('任务描述不能为空'),
  body('type').optional().isIn(['quiz', 'location', 'photo', 'text', 'custom']).withMessage('任务类型无效'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('任务难度无效'),
  body('points').optional().isInt({ min: 1 }).withMessage('任务积分必须大于0')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在'
      })
    }

    const updateData = req.body
    Object.assign(task, updateData)

    await task.save()

    res.json({
      code: 200,
      message: '任务更新成功',
      data: { task }
    })
  } catch (error) {
    console.error('更新任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新任务失败'
    })
  }
})

// 删除任务
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在'
      })
    }

    // 检查是否有任务记录
    const recordCount = await TaskRecord.countDocuments({ task: task._id })
    if (recordCount > 0) {
      return res.status(400).json({
        code: 400,
        message: '该任务已有用户记录，无法删除'
      })
    }

    await Task.findByIdAndDelete(req.params.id)

    res.json({
      code: 200,
      message: '任务删除成功'
    })
  } catch (error) {
    console.error('删除任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '删除任务失败'
    })
  }
})

// 获取活动的任务列表
router.get('/activity/:activityId', adminAuth, async (req, res) => {
  try {
    const { activityId } = req.params

    const tasks = await Task.find({ activity: activityId })
      .sort({ order: 1, createdAt: -1 })

    // 获取任务统计信息
    const tasksWithStats = await Promise.all(tasks.map(async (task) => {
      const totalAttempts = await TaskRecord.countDocuments({ task: task._id })
      const completedCount = await TaskRecord.countDocuments({ 
        task: task._id, 
        status: 'completed' 
      })
      const completionRate = totalAttempts > 0 ? (completedCount / totalAttempts * 100).toFixed(1) : 0

      return {
        ...task.toJSON(),
        stats: {
          totalAttempts,
          completedCount,
          completionRate: parseFloat(completionRate)
        }
      }
    }))

    res.json({
      code: 200,
      message: '获取成功',
      data: { tasks: tasksWithStats }
    })
  } catch (error) {
    console.error('获取活动任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取活动任务失败'
    })
  }
})

// 获取任务完成记录
router.get('/:id/records', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query
    const skip = (page - 1) * limit

    const query = { task: req.params.id }
    if (status) query.status = status

    const records = await TaskRecord.find(query)
      .populate('user', 'username phone nickname')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await TaskRecord.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取任务记录失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取任务记录失败'
    })
  }
})

module.exports = router