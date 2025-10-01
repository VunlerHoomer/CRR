const express = require('express')
const { body, validationResult } = require('express-validator')
const Quiz = require('../models/Quiz')
const QuizRecord = require('../models/QuizRecord')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()

// 获取题目列表
router.get('/questions', auth, async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query
    
    const query = { isActive: true }
    if (category) query.category = category
    if (difficulty) query.difficulty = difficulty

    const questions = await Quiz.find(query)
      .limit(parseInt(limit))
      .select('-correctAnswer') // 不返回正确答案
      .sort({ createdAt: -1 })

    res.json({
      code: 200,
      message: '获取成功',
      data: { questions }
    })
  } catch (error) {
    console.error('获取题目失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取题目失败'
    })
  }
})

// 提交答案
router.post('/submit', [
  auth,
  body('questionId').isMongoId().withMessage('题目ID无效'),
  body('answer').notEmpty().withMessage('答案不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { questionId, answer } = req.body

    // 获取题目
    const question = await Quiz.findById(questionId)
    if (!question) {
      return res.status(404).json({
        code: 404,
        message: '题目不存在'
      })
    }

    // 判断答案是否正确
    const isCorrect = question.correctAnswer === answer
    let points = 0

    if (isCorrect) {
      // 根据难度给分
      switch (question.difficulty) {
        case 'easy':
          points = 10
          break
        case 'medium':
          points = 20
          break
        case 'hard':
          points = 30
          break
        default:
          points = 10
      }
    }

    // 创建答题记录
    const record = new QuizRecord({
      userId: req.user._id,
      questionId: questionId,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect: isCorrect,
      points: points
    })

    await record.save()

    // 更新用户统计
    await req.user.updateQuizStats(isCorrect)
    if (points > 0) {
      await req.user.addPoints(points)
    }

    res.json({
      code: 200,
      message: isCorrect ? '回答正确' : '回答错误',
      data: {
        isCorrect,
        points,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
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

// 获取答题统计
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        totalQuizCount: user.totalQuizCount,
        correctQuizCount: user.correctQuizCount,
        accuracy: user.accuracy,
        points: user.points,
        level: user.level
      }
    })
  } catch (error) {
    console.error('获取答题统计失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取答题统计失败'
    })
  }
})

module.exports = router
