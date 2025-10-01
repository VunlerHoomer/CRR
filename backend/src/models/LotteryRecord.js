const mongoose = require('mongoose')

const lotteryRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lotteryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lottery',
    required: true
  },
  result: {
    item: {
      type: String,
      required: true
    },
    probability: {
      type: Number,
      required: true
    },
    points: {
      type: Number,
      default: 0
    }
  },
  points: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// 索引
lotteryRecordSchema.index({ userId: 1, createdAt: -1 })
lotteryRecordSchema.index({ lotteryId: 1 })
lotteryRecordSchema.index({ 'result.item': 1 })

module.exports = mongoose.model('LotteryRecord', lotteryRecordSchema)
