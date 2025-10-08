const express = require('express')
const { body, validationResult } = require('express-validator')
const User = require('../../models/User')
const QuizRecord = require('../../models/QuizRecord')
const LotteryRecord = require('../../models/LotteryRecord')
const { adminAuth, checkPermission } = require('../../middleware/adminAuth')

const router = express.Router()

// 所有路由都需要管理员权限
router.use(adminAuth)
router.use(checkPermission('manage_users'))

// 获取所有用户（带分页和搜索）
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (keyword) {
      query.$or = [
        { phone: { $regex: keyword, $options: 'i' } },
        { nickname: { $regex: keyword, $options: 'i' } }
      ]
    }

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

    const users = await User.find(query)
      .select('-__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户列表失败'
    })
  }
})

// 获取用户详细信息
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    // 获取用户的答题记录
    const quizRecords = await QuizRecord.find({ userId: req.params.id })
      .populate('quizId', 'question difficulty')
      .sort({ createdAt: -1 })
      .limit(10)

    // 获取用户的抽签记录
    const lotteryRecords = await LotteryRecord.find({ userId: req.params.id })
      .populate('lotteryId', 'title category')
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        user,
        quizRecords,
        lotteryRecords
      }
    })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户详情失败'
    })
  }
})

// 更新用户信息
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    // 允许更新的字段
    const allowedFields = ['nickname', 'avatar', 'points', 'level', 'isActive', 'phone', 'school', 'gender', 'canAccessTaskManagement']
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field]
      }
    })

    // 如果修改了手机号，需要校验唯一
    if (req.body.phone && req.body.phone !== user.phone) {
      const exists = await User.findOne({ phone: req.body.phone })
      if (exists && exists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ code: 400, message: '该手机号已被占用' })
      }
      user.phone = req.body.phone
    }

    await user.save()

    res.json({
      code: 200,
      message: '用户信息更新成功',
      data: { user }
    })
  } catch (error) {
    console.error('更新用户失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新用户失败'
    })
  }
})

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    // 删除用户相关的所有记录
    await QuizRecord.deleteMany({ userId: req.params.id })
    await LotteryRecord.deleteMany({ userId: req.params.id })
    await User.findByIdAndDelete(req.params.id)

    res.json({
      code: 200,
      message: '用户删除成功'
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '删除用户失败'
    })
  }
})

// 获取用户统计数据
router.get('/stats/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const todayUsers = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    })

    // 获取排行榜前10名
    const topUsers = await User.find()
      .sort({ points: -1 })
      .limit(10)
      .select('nickname phone points level')

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        totalUsers,
        activeUsers,
        todayUsers,
        topUsers
      }
    })
  } catch (error) {
    console.error('获取用户统计失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户统计失败'
    })
  }
})

module.exports = router
