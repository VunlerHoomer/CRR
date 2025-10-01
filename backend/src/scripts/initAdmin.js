require('dotenv').config()
const mongoose = require('mongoose')
const Admin = require('../models/Admin')
const connectDB = require('../config/database')

const initDefaultAdmin = async () => {
  try {
    // 连接数据库
    await connectDB()

    // 检查是否已存在管理员
    const existingAdmin = await Admin.findOne({ username: 'admin' })
    
    if (existingAdmin) {
      console.log('ℹ️  默认管理员已存在，跳过初始化')
      console.log('👤 用户名: admin')
      process.exit(0)
    }

    // 创建默认管理员
    const admin = new Admin({
      username: 'admin',
      password: 'admin123456', // 建议首次登录后修改
      email: 'admin@example.com',
      role: 'super_admin',
      permissions: ['all']
    })

    await admin.save()

    console.log('✅ 默认管理员创建成功')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 用户名: admin')
    console.log('🔑 密码: admin123456')
    console.log('⚠️  请登录后立即修改密码！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 初始化管理员失败:', error)
    process.exit(1)
  }
}

initDefaultAdmin()
