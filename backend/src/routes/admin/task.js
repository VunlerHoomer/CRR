const express = require('express')
const router = express.Router()
const { adminAuth } = require('../../middleware/adminAuth')
const { body, validationResult } = require('express-validator')
const Task = require('../../models/Task')
const Area = require('../../models/Area')

// 所有路由都需要管理员权限
router.use(adminAuth)

// 获取任务列表
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', activityId = '', areaId = '', type = '' } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (activityId) query.activity = activityId
    if (areaId) query.area = areaId
    if (type) query.questionType = type
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { question: { $regex: keyword, $options: 'i' } }
      ]
    }

    const tasks = await Task.find(query)
      .populate('activity', 'title')
      .populate('area', 'name color')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Task.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        tasks,
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

// 创建任务
router.post('/', [
  body('activity').notEmpty().withMessage('活动ID不能为空'),
  body('area').notEmpty().withMessage('区域ID不能为空'),
  body('title').notEmpty().withMessage('任务标题不能为空'),
  body('question').notEmpty().withMessage('任务问题不能为空'),
  body('questionType').isIn(['text', 'number', 'choice', 'multiple']).withMessage('无效的问题类型'),
  body('correctAnswer').notEmpty().withMessage('标准答案不能为空'),
  body('points').isInt({ min: 0 }).withMessage('分数必须是非负整数'),
  body('order').isInt({ min: 0 }).withMessage('顺序必须是非负整数'),
  body('maxAttempts').isInt({ min: 0 }).withMessage('最大尝试次数必须是非负整数')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: 400, message: errors.array()[0].msg })
  }

  try {
    const {
      activity, area, title, description, question, questionType,
      options, correctAnswer, correctAnswers, answerMatchType,
      caseSensitive, numberTolerance, hint, points, order,
      maxAttempts, isActive, attachments, tags, difficulty
    } = req.body

    // 检查区域是否存在
    const existingArea = await Area.findOne({ _id: area, activity })
    if (!existingArea) {
      return res.status(404).json({ code: 404, message: '关联区域不存在' })
    }

    // 验证选择题选项
    if ((questionType === 'choice' || questionType === 'multiple') && (!options || options.length < 2)) {
      return res.status(400).json({ code: 400, message: '选择题至少需要2个选项' })
    }

    // 验证多选题答案
    if (questionType === 'multiple' && (!correctAnswers || correctAnswers.length === 0)) {
      return res.status(400).json({ code: 400, message: '多选题必须设置正确答案' })
    }

    const newTask = new Task({
      activity, area, title, description, question, questionType,
      options: options || [], correctAnswer, correctAnswers: correctAnswers || [],
      answerMatchType: answerMatchType || 'exact', caseSensitive: caseSensitive || false,
      numberTolerance: numberTolerance || 0, hint: hint || '', points: points || 10,
      order: order || 0, maxAttempts: maxAttempts || 0, isActive: isActive !== false,
      attachments: attachments || [], tags: tags || [], difficulty: difficulty || 'medium'
    })

    await newTask.save()
    await newTask.populate('activity', 'title')
    await newTask.populate('area', 'name color')

    res.json({
      code: 200,
      message: '任务创建成功',
      data: { task: newTask }
    })
  } catch (error) {
    console.error('创建任务失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '创建任务失败'
    })
  }
})

// 获取任务详情
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('activity', 'title')
      .populate('area', 'name color')
    
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: { task }
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取任务详情失败'
    })
  }
})

// 更新任务
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('任务标题不能为空'),
  body('question').optional().notEmpty().withMessage('任务问题不能为空'),
  body('questionType').optional().isIn(['text', 'number', 'choice', 'multiple']).withMessage('无效的问题类型'),
  body('correctAnswer').optional().notEmpty().withMessage('标准答案不能为空'),
  body('points').optional().isInt({ min: 0 }).withMessage('分数必须是非负整数'),
  body('order').optional().isInt({ min: 0 }).withMessage('顺序必须是非负整数'),
  body('maxAttempts').optional().isInt({ min: 0 }).withMessage('最大尝试次数必须是非负整数')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: 400, message: errors.array()[0].msg })
  }

  try {
    const {
      title, description, question, questionType, options,
      correctAnswer, correctAnswers, answerMatchType, caseSensitive,
      numberTolerance, hint, points, order, maxAttempts, isActive,
      attachments, tags, difficulty
    } = req.body

    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' })
    }

    // 验证选择题选项
    if ((questionType === 'choice' || questionType === 'multiple') && options && options.length < 2) {
      return res.status(400).json({ code: 400, message: '选择题至少需要2个选项' })
    }

    // 验证多选题答案
    if (questionType === 'multiple' && correctAnswers && correctAnswers.length === 0) {
      return res.status(400).json({ code: 400, message: '多选题必须设置正确答案' })
    }

    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (question !== undefined) updateData.question = question
    if (questionType !== undefined) updateData.questionType = questionType
    if (options !== undefined) updateData.options = options
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer
    if (correctAnswers !== undefined) updateData.correctAnswers = correctAnswers
    if (answerMatchType !== undefined) updateData.answerMatchType = answerMatchType
    if (caseSensitive !== undefined) updateData.caseSensitive = caseSensitive
    if (numberTolerance !== undefined) updateData.numberTolerance = numberTolerance
    if (hint !== undefined) updateData.hint = hint
    if (points !== undefined) updateData.points = points
    if (order !== undefined) updateData.order = order
    if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts
    if (isActive !== undefined) updateData.isActive = isActive
    if (attachments !== undefined) updateData.attachments = attachments
    if (tags !== undefined) updateData.tags = tags
    if (difficulty !== undefined) updateData.difficulty = difficulty

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('activity', 'title')
     .populate('area', 'name color')

    res.json({
      code: 200,
      message: '任务更新成功',
      data: { task: updatedTask }
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
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' })
    }

    // 检查是否有答题记录
    const TaskRecord = require('../../models/TaskRecord')
    const recordCount = await TaskRecord.countDocuments({ task: task._id })
    if (recordCount > 0) {
      return res.status(400).json({ 
        code: 400, 
        message: `无法删除任务，该任务已有 ${recordCount} 条答题记录` 
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

// 批量更新任务顺序
router.put('/batch/order', [
  body('tasks').isArray().withMessage('任务数据必须是数组')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: 400, message: errors.array()[0].msg })
  }

  try {
    const { tasks } = req.body

    // 批量更新顺序
    const updatePromises = tasks.map(task => 
      Task.findByIdAndUpdate(task.id, { order: task.order }, { new: true })
    )

    await Promise.all(updatePromises)

    res.json({
      code: 200,
      message: '顺序更新成功'
    })
  } catch (error) {
    console.error('批量更新顺序失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '批量更新顺序失败'
    })
  }
})

// 获取任务统计
router.get('/:id/stats', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' })
    }

    const TaskRecord = require('../../models/TaskRecord')
    const stats = await TaskRecord.aggregate([
      { $match: { task: task._id } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          correctAttempts: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          totalPoints: { $sum: '$pointsEarned' },
          avgTimeTaken: { $avg: '$timeTaken' },
          avgAttempts: { $avg: '$attemptCount' }
        }
      }
    ])

    const result = stats[0] || {
      totalAttempts: 0,
      correctAttempts: 0,
      totalPoints: 0,
      avgTimeTaken: 0,
      avgAttempts: 0
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        stats: {
          ...result,
          accuracy: result.totalAttempts > 0 ? Math.round((result.correctAttempts / result.totalAttempts) * 100) : 0
        }
      }
    })
  } catch (error) {
    console.error('获取任务统计失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取任务统计失败'
    })
  }
})

module.exports = router
