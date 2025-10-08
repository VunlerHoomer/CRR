const express = require('express')
const router = express.Router()
const Activity = require('../models/Activity')
const Team = require('../models/Team')
const User = require('../models/User')
const { body, validationResult } = require('express-validator')
const auth = require('../middleware/auth')

// 获取活动列表
router.get('/list', async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query
    
    let query = { isActive: true }
    
    // 根据类型筛选
    if (type === 'new') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      query.startTime = { $gte: thirtyDaysAgo }
    } else if (type === 'old') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      query.startTime = { $lt: thirtyDaysAgo }
    }
    
    const skip = (page - 1) * limit
    const activities = await Activity.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
    
    // 添加虚拟字段
    const activitiesWithVirtual = activities.map(activity => ({
      ...activity,
      canRegister: activity.isActive && 
                   activity.status === 'upcoming' && 
                   new Date() < activity.registrationDeadline &&
                   activity.currentParticipants < activity.maxParticipants,
      activityType: activity.startTime > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'new' : 'old'
    }))
    
    const total = await Activity.countDocuments(query)
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        activities: activitiesWithVirtual,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取活动列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取活动列表失败'
    })
  }
})

// 获取活动详情
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
    
    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }
    
    // 检查用户是否已报名（如果已登录）
    let registered = false
    if (req.user) {
      const team = await Team.findOne({
        activity: activity._id,
        'members.user': req.user._id,
        status: 'active'
      })
      registered = !!team
    }
    
    const activityData = {
      ...activity.toObject(),
      canRegister: activity.isActive && 
                   activity.status === 'upcoming' && 
                   new Date() < activity.registrationDeadline &&
                   activity.currentParticipants < activity.maxParticipants,
      registered
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: { activity: activityData }
    })
  } catch (error) {
    console.error('获取活动详情失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取活动详情失败'
    })
  }
})

// 报名活动
router.post('/:id/register', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
    
    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }
    
    // 检查是否可以报名
    const now = new Date()
    if (!activity.isActive || 
        activity.status !== 'upcoming' || 
        now >= activity.registrationDeadline ||
        activity.currentParticipants >= activity.maxParticipants) {
      return res.status(400).json({
        code: 400,
        message: '活动已停止报名或已满员'
      })
    }
    
    // 检查用户是否已报名
    const existingTeam = await Team.findOne({
      activity: activity._id,
      'members.user': req.user._id,
      status: 'active'
    })
    
    if (existingTeam) {
      return res.status(400).json({
        code: 400,
        message: '您已报名此活动'
      })
    }
    
    // 创建新队伍
    const team = new Team({
      name: `${req.user.nickname}的队伍`,
      captain: req.user._id,
      members: [{
        user: req.user._id,
        role: 'member'
      }],
      activity: activity._id
    })
    
    await team.save()
    
    // 更新活动参与人数
    await Activity.findByIdAndUpdate(activity._id, {
      $inc: { currentParticipants: 1 }
    })
    
    res.json({
      code: 200,
      message: '报名成功',
      data: { team }
    })
  } catch (error) {
    console.error('报名活动失败:', error)
    res.status(500).json({
      code: 500,
      message: '报名活动失败'
    })
  }
})

// 取消报名
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
    
    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }
    
    // 查找用户的队伍
    const team = await Team.findOne({
      activity: activity._id,
      'members.user': req.user._id,
      status: 'active'
    })
    
    if (!team) {
      return res.status(400).json({
        code: 400,
        message: '您未报名此活动'
      })
    }
    
    // 如果是队长，解散队伍
    if (team.captain.toString() === req.user._id.toString()) {
      team.status = 'disbanded'
      await team.save()
      
      // 更新活动参与人数
      await Activity.findByIdAndUpdate(activity._id, {
        $inc: { currentParticipants: -team.members.length }
      })
    } else {
      // 如果是普通成员，从队伍中移除
      team.removeMember(req.user._id)
      await team.save()
      
      // 更新活动参与人数
      await Activity.findByIdAndUpdate(activity._id, {
        $inc: { currentParticipants: -1 }
      })
    }
    
    res.json({
      code: 200,
      message: '取消报名成功'
    })
  } catch (error) {
    console.error('取消报名失败:', error)
    res.status(500).json({
      code: 500,
      message: '取消报名失败'
    })
  }
})

module.exports = router
