// 创建管理员账号脚本
const mongoose = require('./backend/node_modules/mongoose')
const Admin = require('./backend/src/models/Admin')

// MongoDB Atlas 连接字符串
const MONGODB_URI = 'mongodb+srv://crr_admin:CRR2025Admin!@crr-cluster.uicl6to.mongodb.net/quiz-lottery?retryWrites=true&w=majority&appName=CRR-Cluster'

console.log('🔐 创建管理员账号...\n')

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
})
.then(async () => {
  console.log('✅ MongoDB 连接成功\n')
  
  try {
    // 检查是否已存在管理员
    const existingAdmin = await Admin.findOne({ username: 'admin' })
    
    if (existingAdmin) {
      console.log('⚠️  管理员账号已存在！')
      console.log('用户名:', existingAdmin.username)
      console.log('邮箱:', existingAdmin.email)
      console.log('\n如需重置密码，请先删除现有管理员账号。')
      process.exit(0)
    }
    
    // 创建管理员账号
    const admin = new Admin({
      username: 'admin',
      password: 'admin123456',
      email: 'admin@example.com',
      role: 'super_admin'
    })
    
    await admin.save()
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ 管理员账号创建成功！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('📋 管理员登录信息：')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('用户名: admin')
    console.log('密码: admin123456')
    console.log('邮箱:', admin.email)
    console.log('角色:', admin.role)
    console.log('ID:', admin._id)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('🌐 管理后台地址：')
    console.log('https://cityrunride-gqcdfxvl16.edgeone.run/login')
    console.log('')
    console.log('💡 登录步骤：')
    console.log('1. 访问登录页面')
    console.log('2. 选择"管理员登录"')
    console.log('3. 输入用户名：admin')
    console.log('4. 输入密码：admin123456')
    console.log('5. 登录成功后会跳转到管理后台！')
    console.log('')
    console.log('✨ 管理员可以：')
    console.log('- 管理题目（增删改查）')
    console.log('- 管理抽签活动')
    console.log('- 查看所有用户信息')
    console.log('- 编辑用户数据')
    console.log('')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message)
    console.error(error)
    process.exit(1)
  }
})
.catch((error) => {
  console.error('❌ MongoDB 连接失败:', error.message)
  process.exit(1)
})

