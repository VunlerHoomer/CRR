const mongoose = require('mongoose')

const taskRecordSchema = new mongoose.Schema({
  // 用户ID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  // 任务ID
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, '任务ID不能为空']
  },
  // 活动ID（冗余存储，便于查询）
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, '活动ID不能为空']
  },
  // 任务状态
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'abandoned'],
    default: 'pending'
  },
  // 完成情况
  completion: {
    // 尝试次数
    attempts: {
      type: Number,
      default: 0
    },
    // 完成时间
    completedAt: {
      type: Date
    },
    // 完成分数
    score: {
      type: Number,
      default: 0
    },
    // 完成详情
    details: {
      // 答题记录
      answers: [{
        question: String,
        userAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        points: Number
      }],
      // 位置签到
      location: {
        latitude: Number,
        longitude: Number,
        checkedInAt: Date
      },
      // 照片记录
      photos: [{
        url: String,
        description: String,
        uploadedAt: Date
      }],
      // 文本内容
      textContent: String,
      // 自定义任务结果
      customResult: mongoose.Schema.Types.Mixed
    }
  },
  // 开始时间
  startedAt: {
    type: Date,
    default: Date.now
  },
  // 最后更新时间
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 索引
taskRecordSchema.index({ user: 1, task: 1 }, { unique: true }) // 用户和任务组合唯一
taskRecordSchema.index({ user: 1, activity: 1 })
taskRecordSchema.index({ task: 1 })
taskRecordSchema.index({ activity: 1 })
taskRecordSchema.index({ status: 1 })
taskRecordSchema.index({ 'completion.completedAt': -1 })

// 方法：完成任务
taskRecordSchema.methods.complete = function(score, details) {
  this.status = 'completed'
  this.completion.completedAt = new Date()
  this.completion.score = score
  this.completion.details = details
  this.lastUpdatedAt = new Date()
  return this.save()
}

// 方法：增加尝试次数
taskRecordSchema.methods.addAttempt = function() {
  this.completion.attempts += 1
  this.lastUpdatedAt = new Date()
  return this.save()
}

// 方法：标记为失败
taskRecordSchema.methods.markAsFailed = function() {
  this.status = 'failed'
  this.lastUpdatedAt = new Date()
  return this.save()
}

// 虚拟字段：是否已完成
taskRecordSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed'
})

// 虚拟字段：是否可以继续尝试
taskRecordSchema.virtual('canRetry').get(function() {
  return this.status !== 'completed' && this.completion.attempts < this.task?.maxAttempts
})

// 转换为JSON时包含虚拟字段
taskRecordSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model('TaskRecord', taskRecordSchema)
