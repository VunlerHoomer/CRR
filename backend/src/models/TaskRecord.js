const mongoose = require('mongoose')

const taskRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, '活动ID不能为空']
  },
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: [true, '区域ID不能为空']
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, '任务ID不能为空']
  },
  // 用户答案
  userAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, '用户答案不能为空']
  },
  // 是否正确
  isCorrect: {
    type: Boolean,
    default: false
  },
  // 获得的分数
  pointsEarned: {
    type: Number,
    default: 0,
    min: [0, '分数不能为负数']
  },
  // 尝试次数
  attemptCount: {
    type: Number,
    default: 1,
    min: [1, '尝试次数至少为1']
  },
  // 完成时间
  completedAt: {
    type: Date
  },
  // 提交时间
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // 用时（秒）
  timeTaken: {
    type: Number,
    default: 0,
    min: [0, '用时不能为负数']
  },
  // 答题开始时间（用于计算用时）
  startTime: {
    type: Date
  },
  // 错误次数
  errorCount: {
    type: Number,
    default: 0,
    min: [0, '错误次数不能为负数']
  }
}, {
  timestamps: true
})

// 索引
taskRecordSchema.index({ user: 1, activity: 1, area: 1, task: 1 })
taskRecordSchema.index({ user: 1, task: 1 }, { unique: true }) // 每个用户每个任务只能有一条记录
taskRecordSchema.index({ activity: 1, isCorrect: 1 })
taskRecordSchema.index({ user: 1, activity: 1, isCorrect: 1 })
taskRecordSchema.index({ user: 1, area: 1, isCorrect: 1 })

// 静态方法：获取用户在某活动中的进度
taskRecordSchema.statics.getUserProgress = async function(userId, activityId) {
  const records = await this.find({ 
    user: userId, 
    activity: activityId,
    isCorrect: true 
  }).populate('area task')

  // 按区域分组
  const progressByArea = {}
  records.forEach(record => {
    const areaId = record.area._id.toString()
    if (!progressByArea[areaId]) {
      progressByArea[areaId] = {
        area: record.area,
        completedTasks: [],
        totalPoints: 0,
        completedCount: 0
      }
    }
    progressByArea[areaId].completedTasks.push(record.task)
    progressByArea[areaId].totalPoints += record.pointsEarned
    progressByArea[areaId].completedCount += 1
  })

  return progressByArea
}

// 静态方法：获取用户在某区域的下一个任务
taskRecordSchema.statics.getNextTask = async function(userId, activityId, areaId) {
  const Task = mongoose.model('Task')
  
  // 获取该区域所有任务
  const allTasks = await Task.find({ 
    activity: activityId,
    area: areaId,
    isActive: true 
  }).sort({ order: 1 })

  if (allTasks.length === 0) {
    return null
  }

  // 获取用户已完成的任务
  const completedRecords = await this.find({
    user: userId,
    task: { $in: allTasks.map(t => t._id) },
    isCorrect: true
  }).select('task')

  const completedTaskIds = completedRecords.map(r => r.task.toString())

  // 找到第一个未完成的任务
  for (const task of allTasks) {
    if (!completedTaskIds.includes(task._id.toString())) {
      return task
    }
  }

  // 所有任务都已完成
  return null
}

// 静态方法：检查用户是否可以访问某个任务
taskRecordSchema.statics.canAccessTask = async function(userId, activityId, areaId, taskId) {
  const Task = mongoose.model('Task')
  
  // 获取该区域所有任务
  const allTasks = await Task.find({ 
    activity: activityId,
    area: areaId,
    isActive: true 
  }).sort({ order: 1 })

  // 找到目标任务的索引
  const targetTaskIndex = allTasks.findIndex(t => t._id.toString() === taskId.toString())
  if (targetTaskIndex === -1) {
    return false
  }

  // 如果是第一个任务，可以访问
  if (targetTaskIndex === 0) {
    return true
  }

  // 检查前一个任务是否已完成
  const previousTask = allTasks[targetTaskIndex - 1]
  const previousRecord = await this.findOne({
    user: userId,
    task: previousTask._id,
    isCorrect: true
  })

  return !!previousRecord
}

// 静态方法：获取用户统计数据
taskRecordSchema.statics.getUserStats = async function(userId, activityId) {
  const stats = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        activity: new mongoose.Types.ObjectId(activityId)
      }
    },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        correctTasks: {
          $sum: { $cond: ['$isCorrect', 1, 0] }
        },
        totalPoints: { $sum: '$pointsEarned' },
        totalAttempts: { $sum: '$attemptCount' },
        totalErrors: { $sum: '$errorCount' },
        avgTimeTaken: { $avg: '$timeTaken' }
      }
    }
  ])

  if (stats.length === 0) {
    return {
      totalTasks: 0,
      correctTasks: 0,
      accuracy: 0,
      totalPoints: 0,
      totalAttempts: 0,
      totalErrors: 0,
      avgTimeTaken: 0
    }
  }

  const stat = stats[0]
  return {
    totalTasks: stat.totalTasks,
    correctTasks: stat.correctTasks,
    accuracy: stat.totalTasks > 0 ? Math.round((stat.correctTasks / stat.totalTasks) * 100) : 0,
    totalPoints: stat.totalPoints,
    totalAttempts: stat.totalAttempts,
    totalErrors: stat.totalErrors,
    avgTimeTaken: Math.round(stat.avgTimeTaken || 0)
  }
}

module.exports = mongoose.model('TaskRecord', taskRecordSchema)
