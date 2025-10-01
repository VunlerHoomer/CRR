// MongoDB 连接测试脚本
const mongoose = require('./backend/node_modules/mongoose')

// 替换为您的 MongoDB Atlas 连接字符串
const MONGODB_URI = 'mongodb+srv://crr_admin:CRR2025Admin!@crr-cluster.uicl6to.mongodb.net/quiz-lottery?retryWrites=true&w=majority&appName=CRR-Cluster'

console.log('🔍 测试 MongoDB Atlas 连接...\n')
console.log('连接字符串（隐藏密码）:')
console.log(MONGODB_URI.replace(/:([^@]+)@/, ':****@'))
console.log('\n正在连接...\n')

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ MongoDB Atlas 连接成功！')
  console.log('✅ 数据库连接正常工作！')
  console.log('\n数据库信息:')
  console.log('- 数据库名:', mongoose.connection.name)
  console.log('- 连接状态:', mongoose.connection.readyState === 1 ? '已连接' : '未连接')
  console.log('- 主机:', mongoose.connection.host)
  
  console.log('\n🎉 测试成功！您的连接字符串是正确的！')
  console.log('\n请将此连接字符串添加到 Vercel 环境变量中。')
  console.log('如果密码包含特殊字符，记得 URL 编码：')
  console.log('  ! → %21')
  console.log('  @ → %40')
  console.log('  # → %23')
  
  process.exit(0)
})
.catch((error) => {
  console.error('❌ MongoDB Atlas 连接失败！\n')
  console.error('错误类型:', error.name)
  console.error('错误信息:', error.message)
  
  console.log('\n💡 可能的原因：')
  
  if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
    console.log('  ❌ 用户名或密码错误')
    console.log('     → 检查 Database Access 中的用户名和密码')
    console.log('     → 密码中的特殊字符需要 URL 编码（! → %21）')
  }
  
  if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
    console.log('  ❌ 集群地址错误')
    console.log('     → 检查连接字符串中的集群地址是否正确')
  }
  
  if (error.message.includes('timeout') || error.message.includes('timed out')) {
    console.log('  ❌ 网络访问被阻止')
    console.log('     → 检查 Network Access 是否添加了 0.0.0.0/0')
    console.log('     → 确保状态为 Active')
  }
  
  console.log('\n🔧 解决方法：')
  console.log('  1. 修改此文件顶部的 MONGODB_URI 为正确的值')
  console.log('  2. 再次运行: node test-mongodb.js')
  console.log('  3. 测试通过后，将相同的值添加到 Vercel')
  
  process.exit(1)
})

