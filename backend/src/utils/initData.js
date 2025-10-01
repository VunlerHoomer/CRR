const Quiz = require('../models/Quiz')
const Lottery = require('../models/Lottery')

// 初始化题目数据
const initQuizData = async () => {
  const quizData = [
    {
      question: '以下哪个是 JavaScript 的数据类型？',
      options: ['String', 'Number', 'Boolean', '以上都是'],
      correctAnswer: '以上都是',
      explanation: 'JavaScript 支持多种数据类型，包括 String、Number、Boolean 等。',
      category: 'general',
      difficulty: 'easy',
      tags: ['javascript', '编程']
    },
    {
      question: 'HTML 中用于创建超链接的标签是？',
      options: ['<link>', '<a>', '<href>', '<url>'],
      correctAnswer: '<a>',
      explanation: '<a> 标签用于创建超链接，href 属性指定链接的目标地址。',
      category: 'general',
      difficulty: 'easy',
      tags: ['html', 'web开发']
    },
    {
      question: 'CSS 中用于设置元素背景颜色的属性是？',
      options: ['color', 'background-color', 'bg-color', 'background'],
      correctAnswer: 'background-color',
      explanation: 'background-color 属性用于设置元素的背景颜色。',
      category: 'general',
      difficulty: 'easy',
      tags: ['css', 'web开发']
    },
    {
      question: '以下哪个不是 HTTP 状态码？',
      options: ['200', '404', '500', '999'],
      correctAnswer: '999',
      explanation: '999 不是标准的 HTTP 状态码。常见的状态码包括 200（成功）、404（未找到）、500（服务器错误）等。',
      category: 'general',
      difficulty: 'medium',
      tags: ['http', 'web开发']
    },
    {
      question: '以下哪个是 Vue.js 的特点？',
      options: ['响应式数据绑定', '组件化开发', '虚拟 DOM', '以上都是'],
      correctAnswer: '以上都是',
      explanation: 'Vue.js 是一个渐进式 JavaScript 框架，具有响应式数据绑定、组件化开发和虚拟 DOM 等特点。',
      category: 'general',
      difficulty: 'medium',
      tags: ['vue', '前端框架']
    },
    {
      question: '以下哪个是 MongoDB 的特点？',
      options: ['文档数据库', 'NoSQL 数据库', '支持复杂查询', '以上都是'],
      correctAnswer: '以上都是',
      explanation: 'MongoDB 是一个基于文档的 NoSQL 数据库，支持复杂的查询操作。',
      category: 'general',
      difficulty: 'medium',
      tags: ['mongodb', '数据库']
    },
    {
      question: '以下哪个是 RESTful API 的设计原则？',
      options: ['无状态', '统一接口', '分层系统', '以上都是'],
      correctAnswer: '以上都是',
      explanation: 'RESTful API 的设计原则包括无状态、统一接口、分层系统等。',
      category: 'general',
      difficulty: 'hard',
      tags: ['api', 'rest', '架构设计']
    },
    {
      question: '以下哪个是 Docker 的核心概念？',
      options: ['容器', '镜像', '仓库', '以上都是'],
      correctAnswer: '以上都是',
      explanation: 'Docker 的核心概念包括容器（Container）、镜像（Image）和仓库（Repository）。',
      category: 'general',
      difficulty: 'hard',
      tags: ['docker', '容器化', 'devops']
    }
  ]

  try {
    const existingQuiz = await Quiz.findOne()
    if (!existingQuiz) {
      await Quiz.insertMany(quizData)
      console.log('✅ 题目数据初始化完成')
    } else {
      console.log('ℹ️ 题目数据已存在，跳过初始化')
    }
  } catch (error) {
    console.error('❌ 题目数据初始化失败:', error)
  }
}

// 初始化抽签数据
const initLotteryData = async () => {
  const lotteryData = [
    {
      title: '每日幸运抽签',
      description: '每日一次，抽取幸运奖品',
      category: 'daily',
      items: ['谢谢参与', '5积分', '10积分', '20积分', '50积分', '100积分'],
      probabilities: [40, 25, 20, 10, 4, 1],
      status: 'active',
      maxDraws: 1
    },
    {
      title: '周末特别抽签',
      description: '周末专属，丰厚奖品等你来拿',
      category: 'weekly',
      items: ['谢谢参与', '10积分', '20积分', '50积分', '100积分', '200积分', '500积分'],
      probabilities: [30, 25, 20, 15, 7, 2, 1],
      status: 'active',
      maxDraws: 3
    },
    {
      title: '节日庆典抽签',
      description: '节日特别活动，超值奖品',
      category: 'special',
      items: ['谢谢参与', '50积分', '100积分', '200积分', '500积分', '1000积分'],
      probabilities: [20, 30, 25, 15, 8, 2],
      status: 'active',
      maxDraws: 5
    }
  ]

  try {
    const existingLottery = await Lottery.findOne()
    if (!existingLottery) {
      await Lottery.insertMany(lotteryData)
      console.log('✅ 抽签数据初始化完成')
    } else {
      console.log('ℹ️ 抽签数据已存在，跳过初始化')
    }
  } catch (error) {
    console.error('❌ 抽签数据初始化失败:', error)
  }
}

// 初始化所有数据
const initAllData = async () => {
  console.log('🚀 开始初始化数据...')
  await initQuizData()
  await initLotteryData()
  console.log('✅ 数据初始化完成')
}

module.exports = {
  initQuizData,
  initLotteryData,
  initAllData
}
