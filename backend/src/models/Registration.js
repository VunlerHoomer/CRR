const mongoose = require('mongoose')

const registrationSchema = new mongoose.Schema({
  // 用户ID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  // 活动ID
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, '活动ID不能为空']
  },
  // 报名状态
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  // 报名时间
  registeredAt: {
    type: Date,
    default: Date.now
  },
  // 审核时间
  reviewedAt: {
    type: Date
  },
  // 审核人
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // 审核备注
  reviewNote: {
    type: String
  },
  // 是否允许访问任务管理
  canAccessTaskManagement: {
    type: Boolean,
    default: false
  },
  // 报名信息
  registrationInfo: {
    // 真实姓名
    realName: {
      type: String,
      required: [true, '真实姓名不能为空']
    },
    // 手机号
    phone: {
      type: String,
      required: [true, '手机号不能为空']
    },
    // 学校
    school: {
      type: String
    },
    // 性别
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    // 邮箱
    email: {
      type: String
    },
    // 紧急联系人
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    // 备注
    note: {
      type: String
    }
  },
  // 签到状态
  checkInStatus: {
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkInTime: {
      type: Date
    }
  }
}, {
  timestamps: true
})

// 添加数据库索引
registrationSchema.index({ user: 1, activity: 1 }, { unique: true }) // 用户和活动组合唯一
registrationSchema.index({ activity: 1 })
registrationSchema.index({ user: 1 })
registrationSchema.index({ status: 1 })
registrationSchema.index({ registeredAt: -1 })
registrationSchema.index({ canAccessTaskManagement: 1 })

// 虚拟字段：是否已审核
registrationSchema.virtual('isReviewed').get(function() {
  return this.status !== 'pending'
})

// 虚拟字段：是否可以参加活动
registrationSchema.virtual('canParticipate').get(function() {
  return this.status === 'approved'
})

// 方法：审核报名
registrationSchema.methods.review = function(status, adminId, note) {
  this.status = status
  this.reviewedAt = new Date()
  this.reviewedBy = adminId
  if (note) {
    this.reviewNote = note
  }
  return this.save()
}

// 方法：签到
registrationSchema.methods.checkIn = function() {
  this.checkInStatus.isCheckedIn = true
  this.checkInStatus.checkInTime = new Date()
  return this.save()
}

// 方法：取消报名
registrationSchema.methods.cancel = function() {
  this.status = 'cancelled'
  return this.save()
}

// 转换为JSON时包含虚拟字段
registrationSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model('Registration', registrationSchema)

