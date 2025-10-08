const express = require('express')
const router = express.Router()
const Team = require('../models/Team')
const User = require('../models/User')
const Activity = require('../models/Activity')
const { body, validationResult } = require('express-validator')
const auth = require('../middleware/auth')

// 获取用户当前队伍
router.get('/my', auth, async (req, res) => {
  try {
    const team = await Team.findOne({
      'members.user': req.user._id,
      status: 'active'
    }).populate('members.user', 'nickname avatar phone')
    
    if (!team) {
      return res.json({
        code: 200,
        message: '获取成功',
        data: { team: null }
      })
    }
    
    // 格式化成员信息
    const formattedMembers = team.members.map(member => ({
      id: member.user._id,
      name: member.user.nickname,
      avatar: member.user.avatar,
      phone: member.user.phone,
      isCurrentUser: member.user._id.toString() === req.user._id.toString(),
      isCaptain: member.user._id.toString() === team.captain.toString(),
      joinedAt: member.joinedAt
    }))
    
    const teamData = {
      _id: team._id,
      name: team.name,
      description: team.description,
      captain: team.captain,
      memberCount: team.members.length,
      maxMembers: team.maxMembers,
      totalPoints: team.totalPoints,
      completedTasks: team.completedTasks,
      invitationCode: team.invitationCode,
      isInvitationCodeValid: team.isInvitationCodeValid,
      members: formattedMembers
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: { team: teamData }
    })
  } catch (error) {
    console.error('获取队伍信息失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取队伍信息失败'
    })
  }
})

// 创建队伍
router.post('/create', auth, [
  body('name').isLength({ min: 2, max: 50 }).withMessage('队伍名称长度应在2-50个字符之间'),
  body('activity').isMongoId().withMessage('活动ID格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }
    
    const { name, activity } = req.body
    
    // 检查活动是否存在且可报名
    const activityDoc = await Activity.findById(activity)
    if (!activityDoc) {
      return res.status(400).json({
        code: 400,
        message: '活动不存在'
      })
    }
    
    const now = new Date()
    if (!activityDoc.isActive || 
        activityDoc.status !== 'upcoming' || 
        now >= activityDoc.registrationDeadline ||
        activityDoc.currentParticipants >= activityDoc.maxParticipants) {
      return res.status(400).json({
        code: 400,
        message: '该活动已停止报名或已满员'
      })
    }
    
    // 检查用户是否已在其他队伍中
    const existingTeam = await Team.findOne({
      'members.user': req.user._id,
      status: 'active'
    })
    
    if (existingTeam) {
      return res.status(400).json({
        code: 400,
        message: '您已在其他队伍中'
      })
    }
    
    // 检查队伍名称是否重复
    const duplicateTeam = await Team.findOne({
      name,
      activity,
      status: 'active'
    })
    
    if (duplicateTeam) {
      return res.status(400).json({
        code: 400,
        message: '该活动中已存在同名队伍'
      })
    }
    
    // 创建队伍
    const team = new Team({
      name,
      description: '',
      captain: req.user._id,
      members: [{
        user: req.user._id,
        role: 'member'
      }],
      activity
    })
    
    // 生成邀请码
    const invitationCode = team.generateInvitationCode()
    
    await team.save()
    
    // 更新活动参与人数
    await Activity.findByIdAndUpdate(activity, {
      $inc: { currentParticipants: 1 }
    })
    
    res.json({
      code: 200,
      message: '队伍创建成功',
      data: { 
        team,
        invitationCode 
      }
    })
  } catch (error) {
    console.error('创建队伍失败:', error)
    res.status(500).json({
      code: 500,
      message: '创建队伍失败'
    })
  }
})

// 生成邀请码
router.post('/invitation-code', auth, async (req, res) => {
  try {
    const team = await Team.findOne({
      captain: req.user._id,
      status: 'active'
    })
    
    if (!team) {
      return res.status(400).json({
        code: 400,
        message: '您不是队长或没有队伍'
      })
    }
    
    // 生成新的邀请码
    const invitationCode = team.generateInvitationCode()
    await team.save()
    
    res.json({
      code: 200,
      message: '邀请码生成成功',
      data: { invitationCode }
    })
  } catch (error) {
    console.error('生成邀请码失败:', error)
    res.status(500).json({
      code: 500,
      message: '生成邀请码失败'
    })
  }
})

// 通过邀请码加入队伍
router.post('/join', auth, [
  body('invitationCode').isLength({ min: 6, max: 6 }).withMessage('邀请码必须是6位字符')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }
    
    const { invitationCode } = req.body
    
    // 查找邀请码对应的队伍
    const team = await Team.findOne({
      invitationCode: invitationCode,
      status: 'active'
    }).populate('members.user', 'nickname avatar phone')
    
    if (!team) {
      return res.status(400).json({
        code: 400,
        message: '邀请码无效'
      })
    }
    
    // 检查邀请码是否过期
    if (!team.isInvitationCodeValid) {
      return res.status(400).json({
        code: 400,
        message: '邀请码已过期'
      })
    }
    
    // 检查队伍是否已满
    if (team.isFull) {
      return res.status(400).json({
        code: 400,
        message: '队伍已满'
      })
    }
    
    // 检查用户是否已在队伍中
    if (team.isMember(req.user._id)) {
      return res.status(400).json({
        code: 400,
        message: '您已在此队伍中'
      })
    }
    
    // 检查用户是否在其他队伍中
    const existingTeam = await Team.findOne({
      'members.user': req.user._id,
      status: 'active'
    })
    
    if (existingTeam) {
      return res.status(400).json({
        code: 400,
        message: '您已在其他队伍中'
      })
    }
    
    // 添加成员
    team.addMember(req.user._id)
    await team.save()
    
    // 清空邀请码（一次性使用）
    team.invitationCode = undefined
    team.invitationCodeExpiry = undefined
    await team.save()
    
    res.json({
      code: 200,
      message: '成功加入队伍',
      data: { team }
    })
  } catch (error) {
    console.error('加入队伍失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '加入队伍失败'
    })
  }
})

// 退出队伍
router.post('/leave', auth, async (req, res) => {
  try {
    const team = await Team.findOne({
      'members.user': req.user._id,
      status: 'active'
    })
    
    if (!team) {
      return res.status(400).json({
        code: 400,
        message: '您不在任何队伍中'
      })
    }
    
    // 如果是队长，解散队伍
    if (team.captain.toString() === req.user._id.toString()) {
      team.status = 'disbanded'
      await team.save()
      
      res.json({
        code: 200,
        message: '队伍已解散'
      })
    } else {
      // 如果是普通成员，从队伍中移除
      team.removeMember(req.user._id)
      await team.save()
      
      res.json({
        code: 200,
        message: '已退出队伍'
      })
    }
  } catch (error) {
    console.error('退出队伍失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '退出队伍失败'
    })
  }
})

// 更新队伍信息
router.put('/update', auth, [
  body('name').optional().isLength({ min: 1, max: 50 }).withMessage('队伍名称长度应在1-50个字符之间'),
  body('description').optional().isLength({ max: 200 }).withMessage('队伍描述不能超过200个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg
      })
    }
    
    const team = await Team.findOne({
      captain: req.user._id,
      status: 'active'
    })
    
    if (!team) {
      return res.status(400).json({
        code: 400,
        message: '您不是队长或没有队伍'
      })
    }
    
    const { name, description } = req.body
    
    if (name) {
      // 检查队伍名称是否重复
      const existingTeam = await Team.findOne({
        name,
        _id: { $ne: team._id },
        status: 'active'
      })
      
      if (existingTeam) {
        return res.status(400).json({
          code: 400,
          message: '队伍名称已存在'
        })
      }
      
      team.name = name
    }
    
    if (description !== undefined) {
      team.description = description
    }
    
    await team.save()
    
    res.json({
      code: 200,
      message: '队伍信息更新成功',
      data: { team }
    })
  } catch (error) {
    console.error('更新队伍信息失败:', error)
    res.status(500).json({
      code: 500,
      message: '更新队伍信息失败'
    })
  }
})

module.exports = router
