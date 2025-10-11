const express = require('express')
const router = express.Router()
const Activity = require('../../models/Activity')

// 获取活动列表（支持分页和筛选）
router.get('/list', async (req, res) => {
  try {
    const mongoose = require('mongoose')
    
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        code: 500,
        message: '数据库未连接'
      })
    }
    
    const { page = 1, limit = 20, type, status, search } = req.query
    
    const query = {}
    
    // 按状态筛选
    if (status && status !== 'all') {
      query.status = status
    }
    
    // 搜索功能
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    const skip = (page - 1) * limit
    const total = await Activity.countDocuments(query)
    let activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
    
    // 按类型筛选（使用虚拟字段activityType）
    if (type && type !== 'all') {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      if (type === 'new') {
        query.startTime = { $gt: thirtyDaysAgo }
      } else if (type === 'old') {
        query.startTime = { $lte: thirtyDaysAgo }
      }
      
      // 重新查询
      const filteredTotal = await Activity.countDocuments(query)
      activities = await Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
      
      // 为每个活动添加type字段
      activities = activities.map(activity => {
        const activityObj = activity.toObject()
        activityObj.type = activity.activityType
        activityObj.startDate = activity.startTime
        activityObj.endDate = activity.endTime
        return activityObj
      })
      
      return res.json({
        code: 200,
        message: '获取成功',
        data: {
          activities,
          pagination: {
            total: filteredTotal,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(filteredTotal / limit)
          }
        }
      })
    }
    
    // 为每个活动添加type字段和日期字段映射
    activities = activities.map(activity => {
      const activityObj = activity.toObject()
      activityObj.type = activity.activityType
      activityObj.startDate = activity.startTime
      activityObj.endDate = activity.endTime
      return activityObj
    })
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        activities,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取活动列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取活动列表失败'
    })
  }
})

// 获取单个活动详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const activity = await Activity.findById(id)
    
    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: activity
    })
  } catch (error) {
    console.error('获取活动详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取活动详情失败'
    })
  }
})

// 创建新活动
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      startDate,
      endDate,
      location,
      maxParticipants,
      registrationDeadline,
      difficulty,
      requirements,
      rewards,
      banner
    } = req.body
    
    // 验证必填字段
    if (!title) {
      return res.status(400).json({
        code: 400,
        message: '活动标题不能为空'
      })
    }
    
    // 设置默认值
    const now = new Date()
    const defaultStartTime = startDate ? new Date(startDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7天后
    const defaultEndTime = endDate ? new Date(endDate) : new Date(defaultStartTime.getTime() + 3 * 60 * 60 * 1000) // 开始后3小时
    const defaultRegistrationDeadline = registrationDeadline ? new Date(registrationDeadline) : new Date(defaultStartTime.getTime() - 24 * 60 * 60 * 1000) // 开始前1天
    
    // 创建活动
    const activity = new Activity({
      title,
      description: description || '暂无描述',
      banner: banner || '/images/default-activity.jpg',
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      location: location || '待定',
      maxParticipants: maxParticipants || 100,
      registrationDeadline: defaultRegistrationDeadline,
      difficulty: difficulty || '中等',
      status: status || 'upcoming',
      requirements: requirements || [],
      rewards: rewards || []
    })
    
    await activity.save()
    
    res.json({
      code: 200,
      message: '创建成功',
      data: activity
    })
  } catch (error) {
    console.error('创建活动失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '创建活动失败'
    })
  }
})

// 更新活动
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      status,
      startDate,
      endDate,
      location,
      maxParticipants,
      registrationDeadline,
      difficulty,
      requirements,
      rewards,
      banner
    } = req.body
    
    const activity = await Activity.findById(id)
    
    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }
    
    // 更新字段
    if (title !== undefined) activity.title = title
    if (description !== undefined) activity.description = description
    if (status !== undefined) activity.status = status
    if (startDate !== undefined) activity.startTime = new Date(startDate)
    if (endDate !== undefined) activity.endTime = new Date(endDate)
    if (location !== undefined) activity.location = location
    if (maxParticipants !== undefined) activity.maxParticipants = maxParticipants
    if (registrationDeadline !== undefined) activity.registrationDeadline = new Date(registrationDeadline)
    if (difficulty !== undefined) activity.difficulty = difficulty
    if (requirements !== undefined) activity.requirements = requirements
    if (rewards !== undefined) activity.rewards = rewards
    if (banner !== undefined) activity.banner = banner
    
    await activity.save()
    
    res.json({
      code: 200,
      message: '更新成功',
      data: activity
    })
  } catch (error) {
    console.error('更新活动失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新活动失败'
    })
  }
})

// 更新活动类型（通过修改startTime来改变虚拟字段activityType）
router.patch('/:id/type', async (req, res) => {
  try {
    const { id } = req.params
    const { type } = req.body
    
    if (!type || !['new', 'old'].includes(type)) {
      return res.status(400).json({
        code: 400,
        message: '活动类型无效，必须是 new 或 old'
      })
    }
    
    const activity = await Activity.findById(id)
    
    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }
    
    // 通过修改startTime来改变活动类型
    const now = new Date()
    if (type === 'new') {
      // 设为新活动：startTime设为最近7天内
      activity.startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      // 设为旧活动：startTime设为30天以前
      activity.startTime = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    }
    
    await activity.save()
    
    res.json({
      code: 200,
      message: '活动类型已更新',
      data: activity
    })
  } catch (error) {
    console.error('更新活动类型失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新活动类型失败'
    })
  }
})

// 更新活动状态（即将开始/进行中/已结束）
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (!status || !['upcoming', 'ongoing', 'ended'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '活动状态无效'
      })
    }
    
    const activity = await Activity.findById(id)
    
    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }
    
    activity.status = status
    await activity.save()
    
    res.json({
      code: 200,
      message: '状态更新成功',
      data: activity
    })
  } catch (error) {
    console.error('更新活动状态失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新活动状态失败'
    })
  }
})

// 删除活动
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const activity = await Activity.findById(id)
    
    if (!activity) {
      return res.status(404).json({
        code: 404,
        message: '活动不存在'
      })
    }
    
    await activity.deleteOne()
    
    res.json({
      code: 200,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除活动失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '删除活动失败'
    })
  }
})

module.exports = router
