const express = require('express')
const { body, validationResult } = require('express-validator')
const Quiz = require('../../models/Quiz')
const { adminAuth, checkPermission } = require('../../middleware/adminAuth')

const router = express.Router()

// 所有路由都需要管理员权限
router.use(adminAuth)
router.use(checkPermission('manage_quiz'))

// 获取所有题目（带分页和筛选）
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, difficulty, keyword } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (category) query.category = category
    if (difficulty) query.difficulty = difficulty
    if (keyword) {
      query.$or = [
        { question: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } }
      ]
    }

    const quizzes = await Quiz.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Quiz.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        quizzes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取题目列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取题目列表失败'
    })
  }
})

// 获取单个题目详情
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
    
    if (!quiz) {
      return res.status(404).json({
        code: 404,
        message: '题目不存在'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: { quiz }
    })
  } catch (error) {
    console.error('获取题目详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取题目详情失败'
    })
  }
})

// 创建题目
router.post('/create', [
  body('question').notEmpty().withMessage('题目不能为空'),
  body('options').isArray({ min: 2 }).withMessage('至少需要2个选项'),
  body('correctAnswer').notEmpty().withMessage('正确答案不能为空'),
  body('category').isIn(['general', 'technology', 'science', 'history', 'other']).withMessage('分类不正确'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('难度不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const quizData = {
      question: req.body.question,
      options: req.body.options,
      correctAnswer: req.body.correctAnswer,
      explanation: req.body.explanation,
      category: req.body.category,
      difficulty: req.body.difficulty,
      tags: req.body.tags || [],
      createdBy: req.admin._id
    }

    const quiz = new Quiz(quizData)
    await quiz.save()

    res.status(201).json({
      code: 200,
      message: '题目创建成功',
      data: { quiz }
    })
  } catch (error) {
    console.error('创建题目失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '创建题目失败'
    })
  }
})

// 更新题目
router.put('/:id', [
  body('question').optional().notEmpty().withMessage('题目不能为空'),
  body('options').optional().isArray({ min: 2 }).withMessage('至少需要2个选项'),
  body('correctAnswer').optional().notEmpty().withMessage('正确答案不能为空'),
  body('category').optional().isIn(['general', 'technology', 'science', 'history', 'other']).withMessage('分类不正确'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('难度不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const quiz = await Quiz.findById(req.params.id)
    
    if (!quiz) {
      return res.status(404).json({
        code: 404,
        message: '题目不存在'
      })
    }

    // 更新字段
    const allowedFields = ['question', 'options', 'correctAnswer', 'explanation', 'category', 'difficulty', 'tags', 'isActive']
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        quiz[field] = req.body[field]
      }
    })

    await quiz.save()

    res.json({
      code: 200,
      message: '题目更新成功',
      data: { quiz }
    })
  } catch (error) {
    console.error('更新题目失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新题目失败'
    })
  }
})

// 删除题目
router.delete('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
    
    if (!quiz) {
      return res.status(404).json({
        code: 404,
        message: '题目不存在'
      })
    }

    await Quiz.findByIdAndDelete(req.params.id)

    res.json({
      code: 200,
      message: '题目删除成功'
    })
  } catch (error) {
    console.error('删除题目失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '删除题目失败'
    })
  }
})

// 批量删除题目
router.post('/batch-delete', [
  body('ids').isArray({ min: 1 }).withMessage('至少选择一个题目')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { ids } = req.body
    await Quiz.deleteMany({ _id: { $in: ids } })

    res.json({
      code: 200,
      message: `成功删除 ${ids.length} 个题目`
    })
  } catch (error) {
    console.error('批量删除题目失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '批量删除失败'
    })
  }
})

module.exports = router
