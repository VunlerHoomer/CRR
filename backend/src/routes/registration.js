const express = require('express')
const { body, validationResult } = require('express-validator')
const Registration = require('../models/Registration')
const Activity = require('../models/Activity')
const auth = require('../middleware/auth')

const router = express.Router()

// 报名活动
router.post('/', [
  auth,
  body('activityId').notEmpty().withMessage('活动ID不能为空'),
  body('registrationInfo.realName').notEmpty().withMessage('真实姓名不能为空'),
  body('registrationInfo.phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }

    const { activityId, registrationInfo } = req.body

    // 检查活动是否存在
    const activity = await Activity.findById(activityId)
    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }

    // 检查活动是否可以报名
    if (activity.status === 'cancelled') {
      return res.status(400).json({
        code: 400,
        message: '活动已取消，无法报名'
      })
    }

    if (activity.status === 'ended') {
      return res.status(400).json({
        code: 400,
        message: '活动已结束，无法报名'
      })
    }

    // 检查报名截止时间
    if (new Date() > new Date(activity.registrationDeadline)) {
      return res.status(400).json({
        code: 400,
        message: '报名已截止'
      })
    }

    // 检查是否已经报名
    const existingRegistration = await Registration.findOne({
      user: req.user._id,
      activity: activityId
    })

    if (existingRegistration) {
      return res.status(400).json({
        code: 400,
        message: '您已报名该活动'
      })
    }

    // 检查人数限制
    const registrationCount = await Registration.countDocuments({
      activity: activityId,
      status: { $in: ['pending', 'approved'] }
    })

    if (registrationCount >= activity.maxParticipants) {
      return res.status(400).json({
        code: 400,
        message: '活动报名人数已满'
      })
    }

    // 创建报名记录
    const registration = await Registration.create({
      user: req.user._id,
      activity: activityId,
      registrationInfo
    })

    // 更新活动当前参与人数
    await Activity.findByIdAndUpdate(activityId, {
      $inc: { currentParticipants: 1 }
    })

    res.json({
      code: 200,
      message: '报名成功',
      data: { registration }
    })
  } catch (error) {
    console.error('报名失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '报名失败'
    })
  }
})

// 获取用户的报名记录
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const skip = (page - 1) * limit

    const query = { user: req.user._id }
    if (status) {
      query.status = status
    }

    const registrations = await Registration.find(query)
      .populate('activity', 'title description banner startTime endTime location status')
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Registration.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取报名记录失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取报名记录失败'
    })
  }
})

// 检查是否已报名某个活动
router.get('/check/:activityId', auth, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      user: req.user._id,
      activity: req.params.activityId
    })

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        isRegistered: !!registration,
        registration: registration || null
      }
    })
  } catch (error) {
    console.error('检查报名状态失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '检查报名状态失败'
    })
  }
})

// 取消报名
router.delete('/:id', auth, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.id,
      user: req.user._id
    })

    if (!registration) {
      return res.status(404).json({
        code: 404,
        message: '报名记录不存在'
      })
    }

    // 只能取消待审核的报名
    if (registration.status !== 'pending') {
      return res.status(400).json({
        code: 400,
        message: '无法取消该报名'
      })
    }

    await registration.cancel()

    // 更新活动当前参与人数
    await Activity.findByIdAndUpdate(registration.activity, {
      $inc: { currentParticipants: -1 }
    })

    res.json({
      code: 200,
      message: '取消报名成功'
    })
  } catch (error) {
    console.error('取消报名失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '取消报名失败'
    })
  }
})

module.exports = router

