const express = require('express')
const router = express.Router()
const Activity = require('../models/Activity')
const Team = require('../models/Team')
const User = require('../models/User')
const { body, validationResult } = require('express-validator')
const auth = require('../middleware/auth')


// 初始化活动数据
router.post('/init', async (req, res) => {
  try {
    // 清空现有活动数据
    await Activity.deleteMany({})
    console.log('已清空现有活动数据')

    // 创建新活动数据（只保留需要的活动）
    const activities = [
      {
        title: '溯槎问帙',
        description: '溯槎问帙，探索未知的奇幻世界。在这场充满神秘色彩的冒险中，你将穿越时空的漩涡，寻找失落的宝藏，揭开古老的秘密。准备好迎接这场充满挑战的奇幻之旅吧！',
        banner: '/images/activities/suchawenzhi.jpg',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后开始
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6小时后结束
        location: '上海市徐汇区',
        maxParticipants: 150,
        currentParticipants: 0,
        difficulty: '中等',
        status: 'upcoming',
        registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后截止报名
        requirements: ['探索精神', '团队协作能力', '观察力'],
        rewards: [
          { name: '探索大师', description: '神秘宝箱奖励', points: 800 },
          { name: '时空旅者', description: '纪念徽章', points: 600 },
          { name: '智慧探寻者', description: '探索证书', points: 400 }
        ]
      },
      {
        title: '末之凉秋',
        description: '最后的秋天，没有归途。在这场诗意的人生探索中，体验季节的变迁和生命的轮回。',
        banner: '/images/activities/late-autumn.jpg',
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90天前开始
        endTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4小时后结束
        location: '上海市徐汇区',
        maxParticipants: 80,
        currentParticipants: 80,
        difficulty: '简单',
        status: 'completed',
        registrationDeadline: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), // 95天前截止
        requirements: ['文学素养', '静心体验'],
        rewards: [
          { name: '诗意人生', description: '诗集一本', points: 200 }
        ]
      }
    ]

    // 插入活动数据
    await Activity.insertMany(activities)
    console.log('活动数据初始化成功')

    // 显示创建的活动
    const createdActivities = await Activity.find({}).sort({ startTime: -1 })
    console.log('创建的活动:')
    createdActivities.forEach(activity => {
      console.log(`- ${activity.title} (${activity.status})`)
    })

    res.json({
      code: 200,
      message: '活动数据初始化成功',
      data: {
        totalActivities: createdActivities.length,
        activities: createdActivities.map(a => ({
          title: a.title,
          startTime: a.startTime,
          status: a.status
        }))
      }
    })
  } catch (error) {
    console.error('初始化活动数据失败:', error)
    res.status(500).json({
      code: 500,
      message: '初始化活动数据失败'
    })
  }
})


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
