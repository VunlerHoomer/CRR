const express = require('express')

const router = express.Router()

// 获取任务列表（用户端）- 暂时移除认证
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, area = '', type = '' } = req.query
    
    // 模拟任务数据（暂时使用静态数据，避免数据库问题）
    const allTasks = [
      {
        _id: '1',
        taskId: '1',
        name: '1-1',
        description: '在静安雕塑公园完成答题任务',
        area: '静安雕塑公园',
        type: 'quiz',
        difficulty: 'easy',
        points: 20,
        maxAttempts: 3,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        _id: '2',
        taskId: '2',
        name: '1-2',
        description: '在静安雕塑公园完成中等难度答题任务',
        area: '静安雕塑公园',
        type: 'quiz',
        difficulty: 'medium',
        points: 30,
        maxAttempts: 2,
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z'
      },
      {
        _id: '3',
        taskId: '3',
        name: '2-1',
        description: '在人民广场完成位置签到任务',
        area: '人民广场',
        type: 'location',
        difficulty: 'easy',
        points: 15,
        maxAttempts: 5,
        isActive: true,
        createdAt: '2024-01-03T00:00:00Z'
      }
    ]

    // 筛选逻辑
    let filteredTasks = allTasks.filter(task => task.isActive)
    
    if (area) {
      filteredTasks = filteredTasks.filter(task => task.area === area)
    }
    
    if (type) {
      filteredTasks = filteredTasks.filter(task => task.type === type)
    }

    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const tasks = filteredTasks.slice(startIndex, endIndex)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredTasks.length,
          pages: Math.ceil(filteredTasks.length / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    res.status(500).json({ code: 500, message: '获取任务列表失败' })
  }
})

module.exports = router
