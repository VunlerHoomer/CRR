const express = require('express')
const Registration = require('../../models/Registration')
const Activity = require('../../models/Activity')
const User = require('../../models/User')
const { adminAuth } = require('../../middleware/adminAuth')

const router = express.Router()

// 所有路由都需要管理员权限
router.use(adminAuth)

// 获取报名列表
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, activityId, keyword } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (status) {
      query.status = status
    }
    if (activityId) {
      query.activity = activityId
    }

    const registrations = await Registration.find(query)
      .populate('user', 'username phone nickname email school gender')
      .populate('activity', 'title startTime endTime location')
      .populate('reviewedBy', 'username')
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    // 如果有关键词搜索
    let filteredRegistrations = registrations
    if (keyword) {
      filteredRegistrations = registrations.filter(reg => {
        const searchStr = `${reg.registrationInfo.realName}${reg.registrationInfo.phone}${reg.user?.username || ''}`
        return searchStr.includes(keyword)
      })
    }

    const total = await Registration.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        registrations: filteredRegistrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取报名列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取报名列表失败'
    })
  }
})

// 获取报名详情
router.get('/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('user', 'username phone nickname email school gender avatar')
      .populate('activity', 'title description banner startTime endTime location maxParticipants')
      .populate('reviewedBy', 'username')

    if (!registration) {
      return res.status(404).json({
        code: 404,
        message: '报名记录不存在'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: { registration }
    })
  } catch (error) {
    console.error('获取报名详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取报名详情失败'
    })
  }
})

// 审核报名
router.put('/:id/review', async (req, res) => {
  try {
    const { status, note } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的审核状态'
      })
    }

    const registration = await Registration.findById(req.params.id)
    if (!registration) {
      return res.status(404).json({
        code: 404,
        message: '报名记录不存在'
      })
    }

    await registration.review(status, req.admin._id, note)

    res.json({
      code: 200,
      message: '审核成功',
      data: { registration }
    })
  } catch (error) {
    console.error('审核报名失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '审核报名失败'
    })
  }
})

// 批量审核报名
router.put('/batch-review', async (req, res) => {
  try {
    const { ids, status, note } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的审核状态'
      })
    }

    const registrations = await Registration.find({
      _id: { $in: ids }
    })

    for (const registration of registrations) {
      await registration.review(status, req.admin._id, note)
    }

    res.json({
      code: 200,
      message: `批量审核成功，共${registrations.length}条记录`
    })
  } catch (error) {
    console.error('批量审核失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '批量审核失败'
    })
  }
})

// 更新任务管理权限
router.put('/:id/task-permission', async (req, res) => {
  try {
    const { canAccessTaskManagement } = req.body

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { canAccessTaskManagement },
      { new: true }
    )

    if (!registration) {
      return res.status(404).json({
        code: 404,
        message: '报名记录不存在'
      })
    }

    res.json({
      code: 200,
      message: '权限更新成功',
      data: { registration }
    })
  } catch (error) {
    console.error('更新权限失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新权限失败'
    })
  }
})

// 签到
router.put('/:id/check-in', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
    if (!registration) {
      return res.status(404).json({
        code: 404,
        message: '报名记录不存在'
      })
    }

    if (registration.status !== 'approved') {
      return res.status(400).json({
        code: 400,
        message: '该报名未通过审核，无法签到'
      })
    }

    await registration.checkIn()

    res.json({
      code: 200,
      message: '签到成功',
      data: { registration }
    })
  } catch (error) {
    console.error('签到失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '签到失败'
    })
  }
})

// 获取活动的报名统计
router.get('/stats/:activityId', async (req, res) => {
  try {
    const activityId = req.params.activityId

    const total = await Registration.countDocuments({ activity: activityId })
    const pending = await Registration.countDocuments({ activity: activityId, status: 'pending' })
    const approved = await Registration.countDocuments({ activity: activityId, status: 'approved' })
    const rejected = await Registration.countDocuments({ activity: activityId, status: 'rejected' })
    const cancelled = await Registration.countDocuments({ activity: activityId, status: 'cancelled' })
    const checkedIn = await Registration.countDocuments({
      activity: activityId,
      'checkInStatus.isCheckedIn': true
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        stats: {
          total,
          pending,
          approved,
          rejected,
          cancelled,
          checkedIn,
          checkInRate: approved > 0 ? ((checkedIn / approved) * 100).toFixed(2) : 0
        }
      }
    })
  } catch (error) {
    console.error('获取统计信息失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取统计信息失败'
    })
  }
})

// 导出报名数据
router.get('/export/:activityId', async (req, res) => {
  try {
    const registrations = await Registration.find({
      activity: req.params.activityId
    })
      .populate('user', 'username phone email')
      .sort({ registeredAt: -1 })

    const exportData = registrations.map(reg => ({
      用户名: reg.user?.username,
      真实姓名: reg.registrationInfo.realName,
      手机号: reg.registrationInfo.phone,
      学校: reg.registrationInfo.school,
      性别: reg.registrationInfo.gender === 'male' ? '男' : reg.registrationInfo.gender === 'female' ? '女' : '其他',
      邮箱: reg.registrationInfo.email,
      报名时间: reg.registeredAt,
      审核状态: reg.status === 'pending' ? '待审核' : reg.status === 'approved' ? '已通过' : reg.status === 'rejected' ? '已拒绝' : '已取消',
      签到状态: reg.checkInStatus.isCheckedIn ? '已签到' : '未签到',
      任务管理权限: reg.canAccessTaskManagement ? '有' : '无'
    }))

    res.json({
      code: 200,
      message: '导出成功',
      data: { registrations: exportData }
    })
  } catch (error) {
    console.error('导出数据失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '导出数据失败'
    })
  }
})

module.exports = router

