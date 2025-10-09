// 测试用的最简API
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    test: 'minimal version'
  })
})

app.get('/', (req, res) => {
  res.json({ message: 'Test API Working' })
})

module.exports = app

