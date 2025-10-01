const mongoose = require('mongoose')
require('dotenv').config()
const { initAllData } = require('../utils/initData')

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-lottery')
    console.log('📊 数据库连接成功')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    process.exit(1)
  }
}

const main = async () => {
  await connectDB()
  await initAllData()
  process.exit(0)
}

main()
