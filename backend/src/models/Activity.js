const mongoose = require('mongoose')

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '活动标题不能为空'],
    maxlength: [100, '活动标题不能超过100个字符']
  },
  description: {
    type: String,
    required: [true, '活动描述不能为空'],
    maxlength: [1000, '活动描述不能超过1000个字符']
  },
  banner: {
    type: String,
    default: '/images/default-activity.jpg'
  },
  startTime: {
    type: Date,
    required: [true, '活动开始时间不能为空']
  },
  endTime: {
    type: Date,
    required: [true, '活动结束时间不能为空']
  },
  location: {
    type: String,
    required: [true, '活动地点不能为空']
  },
  maxParticipants: {
    type: Number,
    required: [true, '最大参与人数不能为空'],
    min: [1, '最大参与人数至少为1']
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: [0, '当前参与人数不能为负数']
  },
  difficulty: {
    type: String,
    enum: ['简单', '中等', '困难'],
    default: '中等'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date,
    required: [true, '报名截止时间不能为空']
  },
  requirements: [{
    type: String
  }],
  rewards: [{
    name: String,
    description: String,
    points: Number
  }]
}, {
  timestamps: true
})

// 索引
activitySchema.index({ status: 1, startTime: 1 })
activitySchema.index({ isActive: 1 })

// 虚拟字段：是否可报名
activitySchema.virtual('canRegister').get(function() {
  const now = new Date()
  return this.isActive && 
         this.status === 'upcoming' && 
         now < this.registrationDeadline &&
         this.currentParticipants < this.maxParticipants
})

// 虚拟字段：活动类型（新活动/旧活动）
activitySchema.virtual('activityType').get(function() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  if (this.startTime > thirtyDaysAgo) {
    return 'new'
  } else {
    return 'old'
  }
})

module.exports = mongoose.model('Activity', activitySchema)
