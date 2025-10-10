const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')

// 简单的测试路由
router.get('/test', auth, (req, res) => {
  res.json({
    code: 200,
    message: '任务路由测试成功',
    data: { timestamp: new Date().toISOString() }
  })
})

// 获取活动区域列表 - 简化版本
router.get('/areas/:activityId', auth, async (req, res) => {
  try {
    const { activityId } = req.params
    const userId = req.user._id

    // 暂时返回简单的测试数据
    res.json({
      code: 200,
      message: '获取成功',
      data: { 
        areas: [
          {
            _id: 'test-area-1',
            name: '测试区域1',
            description: '这是一个测试区域',
            order: 1,
            progress: {
              completed: 0,
              total: 3,
              percentage: 0,
              isCompleted: false
            }
          }
        ]
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

// 获取用户进度统计 - 简化版本
router.get('/progress/:activityId', auth, async (req, res) => {
  try {
    const { activityId } = req.params
    const userId = req.user._id

    // 暂时返回简单的测试数据
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        stats: {
          totalTasks: 3,
          correctTasks: 0,
          totalPoints: 0,
          accuracy: 0
        },
        areaProgress: []
      }
    })
  } catch (error) {
    console.error('获取用户进度失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户进度失败'
    })
  }
})

module.exports = router
