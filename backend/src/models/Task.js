const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  // 关联的活动
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, '活动ID不能为空']
  },
  // 任务名称/编号
  name: {
    type: String,
    required: [true, '任务名称不能为空'],
    trim: true
  },
  // 任务描述
  description: {
    type: String,
    required: [true, '任务描述不能为空'],
    trim: true
  },
  // 任务类型
  type: {
    type: String,
    required: [true, '任务类型不能为空'],
    enum: ['quiz', 'location', 'photo', 'text', 'custom'],
    default: 'quiz'
  },
  // 任务难度
  difficulty: {
    type: String,
    required: [true, '任务难度不能为空'],
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  // 任务积分
  points: {
    type: Number,
    required: [true, '任务积分不能为空'],
    min: [1, '任务积分至少为1'],
    default: function() {
      switch (this.difficulty) {
        case 'easy': return 10
        case 'medium': return 20
        case 'hard': return 30
        default: return 10
      }
    }
  },
  // 最大尝试次数
  maxAttempts: {
    type: Number,
    default: 3,
    min: [1, '最大尝试次数至少为1']
  },
  // 任务位置/区域
  area: {
    type: String,
    required: [true, '任务区域不能为空'],
    trim: true
  },
  // 任务是否激活
  isActive: {
    type: Boolean,
    default: true
  },
  // 任务排序
  order: {
    type: Number,
    default: 0
  },
  // 任务配置（根据类型不同而不同）
  config: {
    // 答题类型配置
    quiz: {
      questions: [{
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
        points: Number
      }]
    },
    // 位置签到配置
    location: {
      latitude: Number,
      longitude: Number,
      radius: Number, // 签到范围（米）
      locationName: String
    },
    // 拍照任务配置
    photo: {
      requiredObjects: [String], // 需要拍摄的对象
      minPhotos: Number, // 最少照片数
      maxPhotos: Number, // 最多照片数
      description: String // 拍照要求
    },
    // 文本任务配置
    text: {
      maxLength: Number, // 最大字数
      minLength: Number, // 最小字数
      prompt: String // 提示文本
    },
    // 自定义任务配置
    custom: {
      instructions: String, // 自定义说明
      requirements: [String], // 完成要求
      validationType: String // 验证方式
    }
  },
  // 创建者
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
})

// 索引
taskSchema.index({ activity: 1, order: 1 })
taskSchema.index({ activity: 1, isActive: 1 })
taskSchema.index({ type: 1 })
taskSchema.index({ difficulty: 1 })

// 虚拟字段：任务统计
taskSchema.virtual('stats', {
  ref: 'TaskRecord',
  localField: '_id',
  foreignField: 'task',
  justOne: false,
  count: true
})

// 转换为JSON时包含虚拟字段
taskSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model('Task', taskSchema)
