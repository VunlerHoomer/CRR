const mongoose = require('mongoose')

const quizRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userAnswer: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // 答题用时（秒）
    default: 0
  }
}, {
  timestamps: true
})

// 索引
quizRecordSchema.index({ userId: 1, createdAt: -1 })
quizRecordSchema.index({ questionId: 1 })
quizRecordSchema.index({ isCorrect: 1 })

module.exports = mongoose.model('QuizRecord', quizRecordSchema)
