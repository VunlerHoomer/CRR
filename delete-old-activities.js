const mongoose = require('mongoose')

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vunler:Vunler2024@cluster0.9kqj6.mongodb.net/crr?retryWrites=true&w=majority'

async function deleteOldActivities() {
  try {
    console.log('🔗 连接数据库...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ 数据库连接成功')

    // 导入Activity模型
    const Activity = require('./backend/src/models/Activity')

    // 查找旧活动（开始时间在30天前的活动）
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    console.log('📅 30天前的时间:', thirtyDaysAgo)

    const oldActivities = await Activity.find({
      startTime: { $lt: thirtyDaysAgo }
    })

    console.log(`🔍 找到 ${oldActivities.length} 个旧活动:`)
    oldActivities.forEach(activity => {
      console.log(`  - ${activity.title} (${activity._id})`)
      console.log(`    开始时间: ${activity.startTime}`)
    })

    if (oldActivities.length > 0) {
      // 删除旧活动
      const result = await Activity.deleteMany({
        startTime: { $lt: thirtyDaysAgo }
      })
      
      console.log(`✅ 成功删除 ${result.deletedCount} 个旧活动`)
    } else {
      console.log('ℹ️  没有找到需要删除的旧活动')
    }

    // 查看剩余的活动
    const remainingActivities = await Activity.find({})
    console.log(`\n📊 剩余活动数量: ${remainingActivities.length}`)
    remainingActivities.forEach(activity => {
      console.log(`  - ${activity.title} (${activity._id})`)
      console.log(`    开始时间: ${activity.startTime}`)
      console.log(`    状态: ${activity.status}`)
    })

  } catch (error) {
    console.error('❌ 操作失败:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 数据库连接已关闭')
  }
}

deleteOldActivities()
