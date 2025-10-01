const mongoose = require('mongoose')

const lotterySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '标题不能为空'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: [true, '分类不能为空'],
    enum: ['daily', 'weekly', 'special', 'event']
  },
  items: [{
    type: String,
    required: true,
    trim: true
  }],
  probabilities: [{
    type: Number,
    required: true,
    min: 0,
    max: 100
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'ended'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  maxDraws: {
    type: Number,
    default: 1 // 每人每天最大抽签次数
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// 验证概率总和为100
lotterySchema.pre('save', function(next) {
  if (this.probabilities.length !== this.items.length) {
    return next(new Error('概率数量必须与物品数量相等'))
  }
  
  const totalProbability = this.probabilities.reduce((sum, prob) => sum + prob, 0)
  if (Math.abs(totalProbability - 100) > 0.01) {
    return next(new Error('概率总和必须为100'))
  }
  
  next()
})

// 索引
lotterySchema.index({ category: 1, status: 1 })
lotterySchema.index({ isActive: 1 })
lotterySchema.index({ createdAt: -1 })

module.exports = mongoose.model('Lottery', lotterySchema)
