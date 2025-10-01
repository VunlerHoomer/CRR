const express = require('express')
const { body, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const Admin = require('../../models/Admin')
const { adminAuth } = require('../../middleware/adminAuth')

const router = express.Router()

// 管理员登录
router.post('/login', [
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { username, password } = req.body

    // 查找管理员（包含密码字段）
    const admin = await Admin.findOne({ username }).select('+password')
    
    if (!admin) {
      return res.status(400).json({
        code: 400,
        message: '用户名或密码错误'
      })
    }

    if (!admin.isActive) {
      return res.status(400).json({
        code: 400,
        message: '账号已被禁用'
      })
    }

    // 验证密码
    const isPasswordValid = await admin.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({
        code: 400,
        message: '用户名或密码错误'
      })
    }

    // 更新最后登录时间和IP
    admin.lastLoginAt = new Date()
    admin.lastLoginIp = req.ip
    await admin.save()

    // 生成JWT令牌（标记为管理员）
    const token = jwt.sign(
      { id: admin._id, isAdmin: true },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        }
      }
    })
  } catch (error) {
    console.error('管理员登录失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '登录失败'
    })
  }
})

// 获取当前管理员信息
router.get('/profile', adminAuth, async (req, res) => {
  try {
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        admin: {
          id: req.admin._id,
          username: req.admin.username,
          email: req.admin.email,
          role: req.admin.role,
          permissions: req.admin.permissions,
          lastLoginAt: req.admin.lastLoginAt
        }
      }
    })
  } catch (error) {
    console.error('获取管理员信息失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取信息失败'
    })
  }
})

// 修改密码
router.put('/change-password', [
  adminAuth,
  body('oldPassword').notEmpty().withMessage('请输入旧密码'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { oldPassword, newPassword } = req.body

    // 获取包含密码的管理员信息
    const admin = await Admin.findById(req.admin._id).select('+password')

    // 验证旧密码
    const isPasswordValid = await admin.comparePassword(oldPassword)
    if (!isPasswordValid) {
      return res.status(400).json({
        code: 400,
        message: '旧密码错误'
      })
    }

    // 更新密码
    admin.password = newPassword
    await admin.save()

    res.json({
      code: 200,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '修改密码失败'
    })
  }
})

module.exports = router
