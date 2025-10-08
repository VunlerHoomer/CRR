const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '队伍名称不能为空'],
    maxlength: [50, '队伍名称不能超过50个字符'],
    unique: true
  },
  description: {
    type: String,
    maxlength: [200, '队伍描述不能超过200个字符']
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '队长不能为空']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'vice_captain'],
      default: 'member'
    }
  }],
  maxMembers: {
    type: Number,
    default: 6,
    min: [2, '队伍最少需要2人'],
    max: [20, '队伍最多20人']
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, '活动不能为空']
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'disbanded'],
    default: 'active'
  },
  invitationCode: {
    type: String,
    unique: true,
    sparse: true
  },
  invitationCodeExpiry: {
    type: Date
  }
}, {
  timestamps: true
})

// 索引
teamSchema.index({ activity: 1 })
teamSchema.index({ captain: 1 })
teamSchema.index({ 'members.user': 1 })
teamSchema.index({ invitationCode: 1 }, { sparse: true })

// 虚拟字段：当前成员数量
teamSchema.virtual('memberCount').get(function() {
  return this.members.length
})

// 虚拟字段：是否已满
teamSchema.virtual('isFull').get(function() {
  return this.members.length >= this.maxMembers
})

// 虚拟字段：邀请码是否有效
teamSchema.virtual('isInvitationCodeValid').get(function() {
  if (!this.invitationCode || !this.invitationCodeExpiry) {
    return false
  }
  return new Date() < this.invitationCodeExpiry
})

// 生成邀请码的方法
teamSchema.methods.generateInvitationCode = function() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  this.invitationCode = result
  this.invitationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时有效期
  
  return result
}

// 检查用户是否在队伍中
teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString())
}

// 添加成员
teamSchema.methods.addMember = function(userId) {
  if (this.isFull) {
    throw new Error('队伍已满')
  }
  
  if (this.isMember(userId)) {
    throw new Error('用户已在队伍中')
  }
  
  this.members.push({
    user: userId,
    joinedAt: new Date(),
    role: 'member'
  })
}

// 移除成员
teamSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => member.user.toString() === userId.toString())
  if (memberIndex === -1) {
    throw new Error('用户不在队伍中')
  }
  
  this.members.splice(memberIndex, 1)
}

// 添加数据库索引
teamSchema.index({ activity: 1 })
teamSchema.index({ captain: 1 })
teamSchema.index({ status: 1 })
teamSchema.index({ invitationCode: 1 }, { unique: true })
teamSchema.index({ points: -1 })
teamSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Team', teamSchema)
