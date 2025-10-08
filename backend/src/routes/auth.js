const express = require('express')
const { body, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { sendSmsCode } = require('../services/smsService')

const router = express.Router()

// 发送验证码
router.post('/send-sms', [
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('请输入正确的手机号')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { phone } = req.body

    // 检查手机号是否已注册
    const existingUser = await User.findOne({ phone })
    if (!existingUser) {
      return res.status(400).json({
        code: 400,
        message: '手机号未注册，请先注册'
      })
    }

    // 发送验证码
    await sendSmsCode(phone)

    res.json({
      code: 200,
      message: '验证码发送成功'
    })
  } catch (error) {
    console.error('发送验证码失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '发送验证码失败'
    })
  }
})

// 登录（支持用户名/手机号/邮箱 + 密码登录）
router.post('/login', [
  body('loginType').isIn(['code', 'password']).withMessage('登录方式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { loginType, username, phone, email, code, password } = req.body

    let user = null

    // 验证码登录（保留向后兼容）
    if (loginType === 'code') {
      if (!phone) {
        return res.status(400).json({
          code: 400,
          message: '请输入手机号'
        })
      }
      if (!code) {
        return res.status(400).json({
          code: 400,
          message: '请输入验证码'
        })
      }
      
      user = await User.findOne({ phone })
      
      if (!user) {
        return res.status(400).json({
          code: 400,
          message: '用户不存在'
        })
      }

      // 验证验证码（这里简化处理）
      if (code !== '123456') {
        return res.status(400).json({
          code: 400,
          message: '验证码错误'
        })
      }
    }
    // 密码登录
    else if (loginType === 'password') {
      if (!password) {
        return res.status(400).json({
          code: 400,
          message: '请输入密码'
        })
      }

      // 查找用户（支持用户名、手机号、邮箱登录）
      if (username) {
        user = await User.findOne({ username }).select('+password')
      } else if (phone) {
        user = await User.findOne({ phone }).select('+password')
      } else if (email) {
        user = await User.findOne({ email }).select('+password')
      } else {
        return res.status(400).json({
          code: 400,
          message: '请输入用户名、手机号或邮箱'
        })
      }
      
      if (!user) {
        return res.status(400).json({
          code: 400,
          message: '用户不存在'
        })
      }

      if (!user.password) {
        return res.status(400).json({
          code: 400,
          message: '该账号未设置密码'
        })
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        return res.status(400).json({
          code: 400,
          message: '密码错误'
        })
      }
    }

    if (!user.isActive) {
      return res.status(400).json({
        code: 400,
        message: '账户已被禁用'
      })
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date()
    await user.save()

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          points: user.points,
          level: user.level
        }
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '登录失败'
    })
  }
})

// 注册
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度应在3-20个字符之间'),
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('请输入正确的手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('email').optional().isEmail().withMessage('请输入正确的邮箱格式')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { username, password, email, phone } = req.body

    // 检查用户名是否已存在
    const existingUserByUsername = await User.findOne({ username })
    if (existingUserByUsername) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      })
    }

    // 检查手机号是否已注册
    const existingUserByPhone = await User.findOne({ phone })
    if (existingUserByPhone) {
      return res.status(400).json({
        code: 400,
        message: '手机号已注册'
      })
    }

    // 检查邮箱是否已注册（如果提供了邮箱）
    if (email) {
      const existingUserByEmail = await User.findOne({ email })
      if (existingUserByEmail) {
        return res.status(400).json({
          code: 400,
          message: '邮箱已注册'
        })
      }
    }

    // 创建用户
    const userData = {
      username,
      phone,
      password,
      nickname: username
    }
    
    // 可选字段
    if (email) userData.email = email
    
    const user = new User(userData)
    await user.save()

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      code: 200,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          points: user.points,
          level: user.level
        }
      }
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '注册失败'
    })
  }
})

module.exports = router
