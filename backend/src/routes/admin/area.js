const express = require('express')
const router = express.Router()
const { adminAuth } = require('../../middleware/adminAuth')
const { body, validationResult } = require('express-validator')
const Area = require('../../models/Area')
const Activity = require('../../models/Activity')

// 所有路由都需要管理员权限
router.use(adminAuth)

// 获取区域列表
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', activityId = '' } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (activityId) {
      query.activity = activityId
    }
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }

    const areas = await Area.find(query)
      .populate('activity', 'title')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Area.countDocuments(query)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        areas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取区域列表失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取区域列表失败'
    })
  }
})

// 创建区域
router.post('/', [
  body('activity').notEmpty().withMessage('活动ID不能为空'),
  body('name').notEmpty().withMessage('区域名称不能为空'),
  body('order').isInt({ min: 0 }).withMessage('顺序必须是非负整数'),
  body('completionBonus').optional().isInt({ min: 0 }).withMessage('奖励分数必须是非负整数')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: 400, message: errors.array()[0].msg })
  }

  try {
    const { activity, name, description, order, isActive, icon, color, completionBonus } = req.body

    // 检查活动是否存在
    const existingActivity = await Activity.findById(activity)
    if (!existingActivity) {
      return res.status(404).json({ code: 404, message: '关联活动不存在' })
    }

    // 检查同名区域是否存在
    const existingArea = await Area.findOne({ activity, name })
    if (existingArea) {
      return res.status(400).json({ code: 400, message: '该活动下已存在同名区域' })
    }

    const newArea = new Area({
      activity,
      name,
      description: description || '',
      order: order || 0,
      isActive: isActive !== false,
      icon: icon || '📍',
      color: color || '#409eff',
      completionBonus: completionBonus || 50
    })

    await newArea.save()
    await newArea.populate('activity', 'title')

    res.json({
      code: 200,
      message: '区域创建成功',
      data: { area: newArea }
    })
  } catch (error) {
    console.error('创建区域失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '创建区域失败'
    })
  }
})

// 获取区域详情
router.get('/:id', async (req, res) => {
  try {
    const area = await Area.findById(req.params.id).populate('activity', 'title')
    
    if (!area) {
      return res.status(404).json({
        code: 404,
        message: '区域不存在'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: { area }
    })
  } catch (error) {
    console.error('获取区域详情失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取区域详情失败'
    })
  }
})

// 更新区域
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('区域名称不能为空'),
  body('order').optional().isInt({ min: 0 }).withMessage('顺序必须是非负整数'),
  body('completionBonus').optional().isInt({ min: 0 }).withMessage('奖励分数必须是非负整数')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: 400, message: errors.array()[0].msg })
  }

  try {
    const { name, description, order, isActive, icon, color, completionBonus } = req.body

    const area = await Area.findById(req.params.id)
    if (!area) {
      return res.status(404).json({ code: 404, message: '区域不存在' })
    }

    // 如果更新名称，检查是否与其他区域重名
    if (name && name !== area.name) {
      const existingArea = await Area.findOne({ 
        activity: area.activity, 
        name, 
        _id: { $ne: area._id } 
      })
      if (existingArea) {
        return res.status(400).json({ code: 400, message: '该活动下已存在同名区域' })
      }
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (order !== undefined) updateData.order = order
    if (isActive !== undefined) updateData.isActive = isActive
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (completionBonus !== undefined) updateData.completionBonus = completionBonus

    const updatedArea = await Area.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('activity', 'title')

    res.json({
      code: 200,
      message: '区域更新成功',
      data: { area: updatedArea }
    })
  } catch (error) {
    console.error('更新区域失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '更新区域失败'
    })
  }
})

// 删除区域
router.delete('/:id', async (req, res) => {
  try {
    const area = await Area.findById(req.params.id)
    if (!area) {
      return res.status(404).json({ code: 404, message: '区域不存在' })
    }

    // 检查是否有任务关联
    const Task = require('../../models/Task')
    const taskCount = await Task.countDocuments({ area: area._id })
    if (taskCount > 0) {
      return res.status(400).json({ 
        code: 400, 
        message: `无法删除区域，该区域下还有 ${taskCount} 个任务` 
      })
    }

    await Area.findByIdAndDelete(req.params.id)

    res.json({
      code: 200,
      message: '区域删除成功'
    })
  } catch (error) {
    console.error('删除区域失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '删除区域失败'
    })
  }
})

// 批量更新区域顺序
router.put('/batch/order', [
  body('areas').isArray().withMessage('区域数据必须是数组')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: 400, message: errors.array()[0].msg })
  }

  try {
    const { areas } = req.body

    // 批量更新顺序
    const updatePromises = areas.map(area => 
      Area.findByIdAndUpdate(area.id, { order: area.order }, { new: true })
    )

    await Promise.all(updatePromises)

    res.json({
      code: 200,
      message: '顺序更新成功'
    })
  } catch (error) {
    console.error('批量更新顺序失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '批量更新顺序失败'
    })
  }
})

module.exports = router
