const mongoose = require('mongoose')

const quizSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, '题目不能为空'],
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: String,
    required: [true, '正确答案不能为空']
  },
  explanation: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: [true, '分类不能为空'],
    enum: ['general', 'science', 'history', 'literature', 'sports', 'entertainment']
  },
  difficulty: {
    type: String,
    required: [true, '难度不能为空'],
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: function() {
      switch (this.difficulty) {
        case 'easy': return 10
        case 'medium': return 20
        case 'hard': return 30
        default: return 10
      }
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
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

// 索引
quizSchema.index({ category: 1, difficulty: 1 })
quizSchema.index({ isActive: 1 })
quizSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Quiz', quizSchema)
