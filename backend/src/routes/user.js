const express = require('express')
const multer = require('multer')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

// 获取用户信息
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        user: {
          id: req.user._id,
          phone: req.user.phone,
          nickname: req.user.nickname,
          avatar: req.user.avatar,
          school: req.user.school,
          gender: req.user.gender,
          points: req.user.points,
          level: req.user.level,
          totalQuizCount: req.user.totalQuizCount,
          correctQuizCount: req.user.correctQuizCount,
          accuracy: req.user.accuracy,
          totalLotteryCount: req.user.totalLotteryCount,
          lastLoginAt: req.user.lastLoginAt,
          canAccessTaskManagement: req.user.canAccessTaskManagement
        }
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户信息失败'
    })
  }
})

// 更新用户信息
router.put('/profile', [
  auth,
  body('nickname').optional().isLength({ min: 2, max: 20 }).withMessage('昵称长度应在2-20个字符之间'),
  body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('请输入正确的手机号'),
  body('school').optional().isLength({ max: 100 }).withMessage('学校名称过长'),
  body('gender').optional().isIn(['male', 'female', 'other', '']).withMessage('性别不合法')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { nickname, avatar, phone, school, gender } = req.body
    const updateData = {}

    if (nickname) updateData.nickname = nickname
    if (avatar) updateData.avatar = avatar
    if (school !== undefined) updateData.school = school
    if (gender !== undefined) updateData.gender = gender

    // 修改手机号需要校验唯一性
    if (phone && phone !== req.user.phone) {
      const exists = await User.findOne({ phone })
      if (exists) {
        return res.status(400).json({ code: 400, message: '该手机号已被占用' })
      }
      updateData.phone = phone
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    )

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          school: user.school,
          gender: user.gender,
          points: user.points,
          level: user.level
        }
      }
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新用户信息失败'
    })
  }
})

// 获取用户答题记录
router.get('/quiz-history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    // 这里应该从QuizRecord模型获取数据，暂时返回模拟数据
    const history = []

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    })
  } catch (error) {
    console.error('获取答题记录失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取答题记录失败'
    })
  }
})

// 获取用户积分记录
router.get('/points-history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    // 这里应该从PointsRecord模型获取数据，暂时返回模拟数据
    const history = []

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    })
  } catch (error) {
    console.error('获取积分记录失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取积分记录失败'
    })
  }
})

// 上传头像（base64 存储到 avatar 字段）
router.post('/avatar', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '未收到文件' })
    }
    // 仅允许 jpg/png
    const mime = req.file.mimetype
    if (!['image/jpeg', 'image/png'].includes(mime)) {
      return res.status(400).json({ code: 400, message: '仅支持 JPG/PNG' })
    }
    const base64 = `data:${mime};base64,${req.file.buffer.toString('base64')}`
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: base64 }, { new: true })
    res.json({ code: 200, message: '上传成功', data: { url: user.avatar, user: {
      id: user._id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      school: user.school,
      gender: user.gender
    } } })
  } catch (error) {
    console.error('上传头像失败:', error)
    res.status(500).json({ code: 500, message: error.message || '上传失败' })
  }
})

module.exports = router
