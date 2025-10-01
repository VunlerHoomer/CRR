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

// 登录（支持验证码和密码两种方式）
router.post('/login', [
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('请输入正确的手机号'),
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

    const { phone, loginType, code, password } = req.body

    // 查找用户（如果是密码登录需要包含password字段）
    const user = loginType === 'password' 
      ? await User.findOne({ phone }).select('+password')
      : await User.findOne({ phone })
    
    if (!user) {
      return res.status(400).json({
        code: 400,
        message: '用户不存在'
      })
    }

    if (!user.isActive) {
      return res.status(400).json({
        code: 400,
        message: '账户已被禁用'
      })
    }

    // 验证码登录
    if (loginType === 'code') {
      if (!code) {
        return res.status(400).json({
          code: 400,
          message: '请输入验证码'
        })
      }
      // 验证验证码（这里简化处理，实际应该验证短信验证码）
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
      if (!user.password) {
        return res.status(400).json({
          code: 400,
          message: '该账号未设置密码，请使用验证码登录'
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
          phone: user.phone,
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
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('请输入正确的手机号'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('验证码必须是6位数字'),
  body('nickname').optional().isLength({ min: 2, max: 20 }).withMessage('昵称长度应在2-20个字符之间'),
  body('password').optional().isLength({ min: 6 }).withMessage('密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { phone, code, nickname, password } = req.body

    // 验证验证码（简化处理，实际应该验证短信验证码）
    if (code !== '123456') {
      return res.status(400).json({
        code: 400,
        message: '验证码错误'
      })
    }

    // 检查手机号是否已注册
    const existingUser = await User.findOne({ phone })
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '手机号已注册'
      })
    }

    // 创建用户
    const userData = {
      phone,
      nickname: nickname || `用户${phone.slice(-4)}`
    }
    
    // 如果提供了密码，则设置密码
    if (password) {
      userData.password = password
    }
    
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
          phone: user.phone,
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
