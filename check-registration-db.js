// 检查数据库中报名记录的脚本
const mongoose = require('mongoose')
require('dotenv').config()

// 连接MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ 已连接到MongoDB')
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message)
    process.exit(1)
  }
}

// 定义模型（简化版）
const RegistrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  registeredAt: { type: Date, default: Date.now },
  registrationInfo: {
    realName: String,
    phone: String,
    school: String,
    gender: String,
    email: String,
    note: String
  }
}, { timestamps: true })

const Registration = mongoose.model('Registration', RegistrationSchema)

const UserSchema = new mongoose.Schema({
  username: String,
  phone: String,
  nickname: String
})
const User = mongoose.model('User', UserSchema)

const ActivitySchema = new mongoose.Schema({
  title: String,
  description: String
})
const Activity = mongoose.model('Activity', ActivitySchema)

async function checkRegistrations() {
  try {
    console.log('🔍 检查数据库中的报名记录...\n')

    // 1. 检查总报名数量
    const totalRegistrations = await Registration.countDocuments()
    console.log(`📊 数据库中总报名记录数: ${totalRegistrations}`)

    if (totalRegistrations === 0) {
      console.log('❌ 数据库中没有报名记录！')
      return
    }

    // 2. 获取最近的报名记录
    const recentRegistrations = await Registration.find()
      .populate('user', 'username phone nickname')
      .populate('activity', 'title')
      .sort({ registeredAt: -1 })
      .limit(10)

    console.log(`\n📋 最近 ${recentRegistrations.length} 条报名记录:`)
    console.log('=' .repeat(80))

    recentRegistrations.forEach((reg, index) => {
      console.log(`${index + 1}. 报名记录 ID: ${reg._id}`)
      console.log(`   用户: ${reg.user?.username || '未知'} (${reg.user?.phone || '无手机号'})`)
      console.log(`   活动: ${reg.activity?.title || '未知活动'}`)
      console.log(`   姓名: ${reg.registrationInfo?.realName || '未填写'}`)
      console.log(`   手机: ${reg.registrationInfo?.phone || '未填写'}`)
      console.log(`   学校: ${reg.registrationInfo?.school || '未填写'}`)
      console.log(`   性别: ${reg.registrationInfo?.gender || '未填写'}`)
      console.log(`   状态: ${reg.status}`)
      console.log(`   报名时间: ${reg.registeredAt?.toLocaleString('zh-CN')}`)
      console.log(`   创建时间: ${reg.createdAt?.toLocaleString('zh-CN')}`)
      console.log(`   更新时间: ${reg.updatedAt?.toLocaleString('zh-CN')}`)
      console.log('-'.repeat(80))
    })

    // 3. 按状态统计
    const statusStats = await Registration.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    console.log('\n📈 按状态统计:')
    statusStats.forEach(stat => {
      const statusText = {
        'pending': '待审核',
        'approved': '已通过', 
        'rejected': '已拒绝',
        'cancelled': '已取消'
      }[stat._id] || stat._id
      console.log(`   ${statusText}: ${stat.count} 条`)
    })

    // 4. 按活动统计
    const activityStats = await Registration.aggregate([
      {
        $group: {
          _id: '$activity',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'activities',
          localField: '_id',
          foreignField: '_id',
          as: 'activityInfo'
        }
      }
    ])

    console.log('\n🎯 按活动统计:')
    activityStats.forEach(stat => {
      const activityTitle = stat.activityInfo[0]?.title || '未知活动'
      console.log(`   ${activityTitle}: ${stat.count} 条报名`)
    })

    // 5. 检查今天的报名
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRegistrations = await Registration.countDocuments({
      registeredAt: { $gte: today }
    })
    console.log(`\n📅 今天新增报名: ${todayRegistrations} 条`)

    // 6. 检查最近的报名（最近1小时）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRegistrationsCount = await Registration.countDocuments({
      registeredAt: { $gte: oneHourAgo }
    })
    console.log(`⏰ 最近1小时新增报名: ${recentRegistrationsCount} 条`)

  } catch (error) {
    console.error('❌ 检查报名记录时出错:', error.message)
  }
}

async function main() {
  await connectDB()
  await checkRegistrations()
  await mongoose.disconnect()
  console.log('\n✅ 检查完成，已断开数据库连接')
}

main()
