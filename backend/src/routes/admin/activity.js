const express = require('express')
const router = express.Router()
const Activity = require('../../models/Activity')

// 获取活动列表（支持分页和筛选）
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query
    
    const query = {}
    
    // 按类型筛选
    if (type && type !== 'all') {
      query.type = type
    }
    
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
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
    
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
      type,
      status,
      startDate,
      endDate,
      location,
      maxParticipants,
      tags,
      coverImage,
      content
    } = req.body
    
    // 验证必填字段
    if (!title) {
      return res.status(400).json({
        code: 400,
        message: '活动标题不能为空'
      })
    }
    
    // 创建活动
    const activity = new Activity({
      title,
      description: description || '',
      type: type || 'new',
      status: status || 'upcoming',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      location: location || '',
      maxParticipants: maxParticipants || 0,
      tags: tags || [],
      coverImage: coverImage || '',
      content: content || ''
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
      type,
      status,
      startDate,
      endDate,
      location,
      maxParticipants,
      tags,
      coverImage,
      content
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
    if (type !== undefined) activity.type = type
    if (status !== undefined) activity.status = status
    if (startDate !== undefined) activity.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) activity.endDate = endDate ? new Date(endDate) : null
    if (location !== undefined) activity.location = location
    if (maxParticipants !== undefined) activity.maxParticipants = maxParticipants
    if (tags !== undefined) activity.tags = tags
    if (coverImage !== undefined) activity.coverImage = coverImage
    if (content !== undefined) activity.content = content
    
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

// 更新活动状态（新活动/旧活动）
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
    
    activity.type = type
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
