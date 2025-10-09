const mongoose = require('mongoose')

const areaSchema = new mongoose.Schema({
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, '区域必须关联活动']
  },
  name: {
    type: String,
    required: [true, '区域名称不能为空'],
    trim: true,
    maxlength: [50, '区域名称不能超过50个字符']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, '区域描述不能超过500个字符']
  },
  order: {
    type: Number,
    default: 0,
    min: [0, '顺序不能为负数']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    default: '📍'
  },
  color: {
    type: String,
    default: '#409eff'
  },
  // 区域完成奖励分数
  completionBonus: {
    type: Number,
    default: 50,
    min: [0, '奖励分数不能为负数']
  }
}, {
  timestamps: true
})

// 索引
areaSchema.index({ activity: 1, order: 1 })
areaSchema.index({ activity: 1, isActive: 1 })

// 虚拟字段：获取该区域下的任务数量
areaSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'area',
  count: true
})

// 实例方法：获取该区域的所有任务
areaSchema.methods.getTasks = async function() {
  const Task = mongoose.model('Task')
  return await Task.find({ area: this._id, isActive: true }).sort({ order: 1 })
}

// 实例方法：检查用户是否完成该区域
areaSchema.methods.isCompletedByUser = async function(userId) {
  const Task = mongoose.model('Task')
  const TaskRecord = mongoose.model('TaskRecord')
  
  const tasks = await Task.find({ area: this._id, isActive: true })
  if (tasks.length === 0) return false
  
  const completedCount = await TaskRecord.countDocuments({
    user: userId,
    task: { $in: tasks.map(t => t._id) },
    isCorrect: true
  })
  
  return completedCount === tasks.length
}

module.exports = mongoose.model('Area', areaSchema)
