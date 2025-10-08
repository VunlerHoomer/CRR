const mongoose = require('mongoose')
const Activity = require('./src/models/Activity')

// 连接数据库
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-lottery'
    await mongoose.connect(mongoURI)
    console.log('MongoDB 连接成功')
  } catch (error) {
    console.error('MongoDB 连接失败:', error)
    process.exit(1)
  }
}

// 初始化活动数据
const initActivities = async () => {
  try {
    // 清空现有活动数据
    await Activity.deleteMany({})
    console.log('已清空现有活动数据')

    // 创建新活动数据
    const activities = [
      {
        title: 'POLISSOP IV',
        description: '探索城市奥秘，挑战智慧极限。这是一场充满挑战和乐趣的城市定向活动，考验你的观察力、判断力和团队协作能力。',
        banner: '/images/activities/polissop-iv.jpg',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后开始
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8小时后结束
        location: '上海市静安区',
        maxParticipants: 200,
        currentParticipants: 156,
        difficulty: '中等',
        status: 'upcoming',
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后截止报名
        requirements: ['身体健康', '团队协作能力', '基本体能'],
        rewards: [
          { name: '一等奖', description: '现金奖励10000元', points: 1000 },
          { name: '二等奖', description: '现金奖励5000元', points: 800 },
          { name: '三等奖', description: '现金奖励2000元', points: 600 }
        ]
      },
      {
        title: 'PilotSH',
        description: '成为传奇机长吧！体验飞行的魅力，挑战空中导航技能，在虚拟的蓝天中展现你的飞行天赋。',
        banner: '/images/activities/pilot-sh.jpg',
        startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15天前开始
        endTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6小时后结束
        location: '上海市浦东新区',
        maxParticipants: 150,
        currentParticipants: 150,
        difficulty: '困难',
        status: 'completed',
        registrationDeadline: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20天前截止
        requirements: ['基础飞行知识', '团队合作精神'],
        rewards: [
          { name: '飞行达人', description: '飞行模拟器使用权', points: 500 }
        ]
      },
      {
        title: 'PolisSH120',
        description: '百廿寻踪，追溯历史足迹。在这场文化探索之旅中，你将深入了解这座城市的历史底蕴和文化传承。',
        banner: '/images/activities/polissh120.jpg',
        startTime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45天前开始
        endTime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10小时后结束
        location: '上海市黄浦区',
        maxParticipants: 100,
        currentParticipants: 100,
        difficulty: '中等',
        status: 'completed',
        registrationDeadline: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50天前截止
        requirements: ['历史文化兴趣', '徒步能力'],
        rewards: [
          { name: '文化探索者', description: '历史文化书籍一套', points: 300 }
        ]
      },
      {
        title: '末之凉秋',
        description: '最后的秋天，没有归途。在这场诗意的人生探索中，体验季节的变迁和生命的轮回。',
        banner: '/images/activities/late-autumn.jpg',
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90天前开始
        endTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4小时后结束
        location: '上海市徐汇区',
        maxParticipants: 80,
        currentParticipants: 80,
        difficulty: '简单',
        status: 'completed',
        registrationDeadline: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), // 95天前截止
        requirements: ['文学素养', '静心体验'],
        rewards: [
          { name: '诗意人生', description: '诗集一本', points: 200 }
        ]
      }
    ]

    // 插入活动数据
    await Activity.insertMany(activities)
    console.log('活动数据初始化成功')

    // 显示创建的活动
    const createdActivities = await Activity.find({}).sort({ startTime: -1 })
    console.log('\n创建的活动:')
    createdActivities.forEach(activity => {
      console.log(`- ${activity.title} (${activity.status})`)
    })

  } catch (error) {
    console.error('初始化活动数据失败:', error)
  }
}

// 主函数
const main = async () => {
  await connectDB()
  await initActivities()
  await mongoose.disconnect()
  console.log('\n数据库连接已关闭')
  process.exit(0)
}

// 运行脚本
if (require.main === module) {
  main()
}

module.exports = { initActivities }
