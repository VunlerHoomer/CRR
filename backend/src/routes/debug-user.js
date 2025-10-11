const express = require('express')
const router = express.Router()

// 调试用户ID传递的路由
router.get('/test-user-id', (req, res) => {
  const userId = req.query.userId
  
  res.json({
    code: 200,
    message: '用户ID调试信息',
    data: {
      receivedUserId: userId,
      userIdType: typeof userId,
      timestamp: new Date().toISOString()
    }
  })
})

module.exports = router
