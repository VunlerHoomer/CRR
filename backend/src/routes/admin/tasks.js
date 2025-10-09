const express = require('express')
const { adminAuth } = require('../../middleware/adminAuth')

const router = express.Router()

// 获取任务列表
router.get('/list', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', type = '', status = '' } = req.query

    // 模拟任务数据
    const allTasks = [
      {
        _id: '1',
        taskId: '1',
        name: '1-1',
        description: '在静安雕塑公园完成基础地理知识答题',
        area: '静安雕塑公园',
        type: 'quiz',
        difficulty: 'easy',
        points: 20,
        maxAttempts: 3,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        totalAttempts: 15,
        completedCount: 12,
        completionRate: 80
      },
      {
        _id: '2',
        taskId: '2',
        name: '1-2',
        description: '在静安雕塑公园完成进阶历史知识答题',
        area: '静安雕塑公园',
        type: 'quiz',
        difficulty: 'medium',
        points: 30,
        maxAttempts: 2,
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z',
        totalAttempts: 8,
        completedCount: 5,
        completionRate: 62.5
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
        createdAt: '2024-01-03T00:00:00Z',
        totalAttempts: 20,
        completedCount: 18,
        completionRate: 90
      },
      {
        _id: '4',
        taskId: '4',
        name: '3-1',
        description: '在外滩拍摄标志性建筑照片',
        area: '外滩',
        type: 'photo',
        difficulty: 'easy',
        points: 25,
        maxAttempts: 3,
        isActive: false,
        createdAt: '2024-01-04T00:00:00Z',
        totalAttempts: 12,
        completedCount: 10,
        completionRate: 83.3
      }
    ]

    // 简单的筛选逻辑
    let filteredTasks = allTasks

    if (keyword) {
      filteredTasks = filteredTasks.filter(task => 
        task.name.includes(keyword) || 
        task.description.includes(keyword) ||
        task.area.includes(keyword)
      )
    }

    if (type) {
      filteredTasks = filteredTasks.filter(task => task.type === type)
    }

    if (status) {
      if (status === 'active') {
        filteredTasks = filteredTasks.filter(task => task.isActive)
      } else if (status === 'inactive') {
        filteredTasks = filteredTasks.filter(task => !task.isActive)
      }
    }

    // 分页
    const total = filteredTasks.length
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
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取任务列表失败'
    })
  }
})

// 获取任务详情
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const taskId = req.params.id
    
    // 模拟任务详情
    const task = {
      _id: taskId,
      taskId: '1',
      name: '1-1',
      description: '在静安雕塑公园完成基础地理知识答题',
      area: '静安雕塑公园',
      type: 'quiz',
      difficulty: 'easy',
      points: 20,
      maxAttempts: 3,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      totalAttempts: 15,
      completedCount: 12,
      completionRate: 80,
      totalPoints: 240
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: { task }
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取任务详情失败'
    })
  }
})

// 创建任务
router.post('/create', adminAuth, async (req, res) => {
  try {
    const { name, description, area, type, points, difficulty, maxAttempts } = req.body

    // 简单的验证
    if (!name || !description || !area || !type || !points) {
      return res.status(400).json({
        code: 400,
        message: '请填写所有必填字段'
      })
    }

    // 模拟创建任务
    const newTask = {
      _id: Date.now().toString(),
      taskId: Date.now().toString(),
      name,
      description,
      area,
      type,
      difficulty: difficulty || 'easy',
      points: parseInt(points),
      maxAttempts: parseInt(maxAttempts) || 3,
      isActive: true,
      createdAt: new Date().toISOString(),
      totalAttempts: 0,
      completedCount: 0,
      completionRate: 0
    }

    res.json({
      code: 200,
      message: '任务创建成功',
      data: { task: newTask }
    })
  } catch (error) {
    console.error('创建任务失败:', error)
    res.status(500).json({
      code: 500,
      message: '创建任务失败'
    })
  }
})

// 更新任务
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const taskId = req.params.id
    const updateData = req.body

    // 模拟更新任务
    const updatedTask = {
      _id: taskId,
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    res.json({
      code: 200,
      message: '任务更新成功',
      data: { task: updatedTask }
    })
  } catch (error) {
    console.error('更新任务失败:', error)
    res.status(500).json({
      code: 500,
      message: '更新任务失败'
    })
  }
})

// 删除任务
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const taskId = req.params.id

    // 模拟删除任务
    res.json({
      code: 200,
      message: '任务删除成功'
    })
  } catch (error) {
    console.error('删除任务失败:', error)
    res.status(500).json({
      code: 500,
      message: '删除任务失败'
    })
  }
})

// 获取队伍进度
router.get('/teams/progress', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query

    // 模拟队伍进度数据
    const allTeams = [
      {
        _id: 'team1',
        name: '测试队伍1',
        leader: '队长1',
        memberCount: 5,
        totalPoints: 120,
        completedTasks: 8,
        totalTasks: 10,
        completionRate: 80,
        lastActivity: '2024-01-15T10:30:00Z'
      },
      {
        _id: 'team2',
        name: '测试队伍2',
        leader: '队长2',
        memberCount: 3,
        totalPoints: 85,
        completedTasks: 6,
        totalTasks: 10,
        completionRate: 60,
        lastActivity: '2024-01-14T15:20:00Z'
      },
      {
        _id: 'team3',
        name: '测试队伍3',
        leader: '队长3',
        memberCount: 4,
        totalPoints: 95,
        completedTasks: 7,
        totalTasks: 10,
        completionRate: 70,
        lastActivity: '2024-01-13T09:15:00Z'
      }
    ]

    // 分页
    const total = allTeams.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const teams = allTeams.slice(startIndex, endIndex)

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        teams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取队伍进度失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取队伍进度失败'
    })
  }
})

module.exports = router
