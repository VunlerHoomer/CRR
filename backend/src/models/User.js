const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, '手机号不能为空'],
    unique: true,
    match: [/^1[3-9]\d{9}$/, '请输入正确的手机号']
  },
  password: {
    type: String,
    select: false  // 默认查询时不返回密码
  },
  nickname: {
    type: String,
    default: function() {
      return `用户${this.phone.slice(-4)}`
    }
  },
  avatar: {
    type: String,
    default: ''
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  totalQuizCount: {
    type: Number,
    default: 0
  },
  correctQuizCount: {
    type: Number,
    default: 0
  },
  totalLotteryCount: {
    type: Number,
    default: 0
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// 计算准确率
userSchema.virtual('accuracy').get(function() {
  if (this.totalQuizCount === 0) return 0
  return Math.round((this.correctQuizCount / this.totalQuizCount) * 100)
})

// 计算等级
userSchema.methods.calculateLevel = function() {
  const points = this.points
  if (points >= 10000) return 10
  if (points >= 8000) return 9
  if (points >= 6000) return 8
  if (points >= 4000) return 7
  if (points >= 2000) return 6
  if (points >= 1000) return 5
  if (points >= 500) return 4
  if (points >= 200) return 3
  if (points >= 100) return 2
  return 1
}

// 更新等级
userSchema.methods.updateLevel = function() {
  this.level = this.calculateLevel()
  return this.save()
}

// 添加积分
userSchema.methods.addPoints = function(points) {
  this.points += points
  this.updateLevel()
  return this.save()
}

// 更新答题统计
userSchema.methods.updateQuizStats = function(isCorrect) {
  this.totalQuizCount += 1
  if (isCorrect) {
    this.correctQuizCount += 1
  }
  return this.save()
}

// 更新抽签统计
userSchema.methods.updateLotteryStats = function() {
  this.totalLotteryCount += 1
  return this.save()
}

// 密码加密中间件
userSchema.pre('save', async function(next) {
  // 只有密码被修改时才加密
  if (!this.isModified('password')) return next()
  
  if (this.password) {
    // 加密密码
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  next()
})

// 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

// 转换为JSON时包含虚拟字段
userSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model('User', userSchema)
