const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, '任务必须关联活动']
  },
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: [true, '任务必须关联区域']
  },
  title: {
    type: String,
    required: [true, '任务标题不能为空'],
    trim: true,
    maxlength: [100, '任务标题不能超过100个字符']
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, '任务描述不能超过1000个字符']
  },
  question: {
    type: String,
    required: [true, '任务问题不能为空'],
    maxlength: [1000, '任务问题不能超过1000个字符']
  },
  questionType: {
    type: String,
    enum: ['text', 'number', 'choice', 'multiple'],
    default: 'text',
    required: [true, '问题类型不能为空']
  },
  // 选择题选项（仅当questionType为choice或multiple时使用）
  options: [{
    value: { type: String, required: true },
    label: { type: String, required: true }
  }],
  // 标准答案
  correctAnswer: {
    type: String,
    required: [true, '标准答案不能为空'],
    trim: true
  },
  // 多选题答案（数组形式，仅当questionType为multiple时使用）
  correctAnswers: [{
    type: String,
    trim: true
  }],
  // 答案匹配方式
  answerMatchType: {
    type: String,
    enum: ['exact', 'contains', 'regex', 'number'],
    default: 'exact'
  },
  // 是否忽略大小写
  caseSensitive: {
    type: Boolean,
    default: false
  },
  // 数字答案的容差范围（仅当answerMatchType为number时使用）
  numberTolerance: {
    type: Number,
    default: 0
  },
  // 提示信息
  hint: {
    type: String,
    default: '',
    maxlength: [500, '提示信息不能超过500个字符']
  },
  // 任务分数
  points: {
    type: Number,
    default: 10,
    min: [0, '分数不能为负数']
  },
  // 任务顺序
  order: {
    type: Number,
    default: 0,
    min: [0, '顺序不能为负数']
  },
  // 最大尝试次数（0表示无限制）
  maxAttempts: {
    type: Number,
    default: 0,
    min: [0, '最大尝试次数不能为负数']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // 图片或附件
  attachments: [{
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['image', 'video', 'file'],
      default: 'image'
    },
    filename: String,
    size: Number
  }],
  // 任务标签
  tags: [{
    type: String,
    trim: true
  }],
  // 难度等级
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
}, {
  timestamps: true
})

// 索引
taskSchema.index({ activity: 1, area: 1, order: 1 })
taskSchema.index({ area: 1, isActive: 1 })

// 实例方法：验证用户答案
taskSchema.methods.validateAnswer = function(userAnswer) {
  if (!userAnswer) {
    return false
  }

  // 根据问题类型进行不同的验证
  switch (this.questionType) {
    case 'text':
    case 'number':
      return this.validateTextAnswer(userAnswer)
    case 'choice':
      return this.validateChoiceAnswer(userAnswer)
    case 'multiple':
      return this.validateMultipleAnswer(userAnswer)
    default:
      return false
  }
}

// 验证文本和数字答案
taskSchema.methods.validateTextAnswer = function(userAnswer) {
  let answer = String(userAnswer).trim()
  let correctAnswer = this.correctAnswer.trim()

  // 如果不区分大小写，全部转为小写
  if (!this.caseSensitive && this.answerMatchType !== 'number') {
    answer = answer.toLowerCase()
    correctAnswer = correctAnswer.toLowerCase()
  }

  // 根据匹配类型验证答案
  switch (this.answerMatchType) {
    case 'exact':
      return answer === correctAnswer
    case 'contains':
      return answer.includes(correctAnswer) || correctAnswer.includes(answer)
    case 'regex':
      try {
        const regex = new RegExp(correctAnswer)
        return regex.test(answer)
      } catch (error) {
        console.error('正则表达式错误:', error)
        return answer === correctAnswer
      }
    case 'number':
      const userNum = parseFloat(answer)
      const correctNum = parseFloat(correctAnswer)
      if (isNaN(userNum) || isNaN(correctNum)) {
        return answer === correctAnswer
      }
      return Math.abs(userNum - correctNum) <= this.numberTolerance
    default:
      return answer === correctAnswer
  }
}

// 验证单选题答案
taskSchema.methods.validateChoiceAnswer = function(userAnswer) {
  const answer = String(userAnswer).trim()
  const correctAnswer = this.correctAnswer.trim()
  return answer === correctAnswer
}

// 验证多选题答案
taskSchema.methods.validateMultipleAnswer = function(userAnswer) {
  if (!Array.isArray(userAnswer)) {
    return false
  }
  
  const userAnswers = userAnswer.map(a => String(a).trim()).sort()
  const correctAnswers = this.correctAnswers.map(a => String(a).trim()).sort()
  
  if (userAnswers.length !== correctAnswers.length) {
    return false
  }
  
  return userAnswers.every((answer, index) => answer === correctAnswers[index])
}

// 虚拟字段：获取完成该任务的用户数量
taskSchema.virtual('completedCount', {
  ref: 'TaskRecord',
  localField: '_id',
  foreignField: 'task',
  count: true,
  match: { isCorrect: true }
})

// 静态方法：获取用户在某区域的下一个任务
taskSchema.statics.getNextTask = async function(activityId, areaId, userId) {
  const TaskRecord = mongoose.model('TaskRecord')
  
  // 获取该区域所有任务
  const allTasks = await this.find({ 
    activity: activityId,
    area: areaId,
    isActive: true 
  }).sort({ order: 1 })

  if (allTasks.length === 0) {
    return null
  }

  // 获取用户已完成的任务
  const completedRecords = await TaskRecord.find({
    user: userId,
    task: { $in: allTasks.map(t => t._id) },
    isCorrect: true
  }).select('task')

  const completedTaskIds = completedRecords.map(r => r.task.toString())

  // 找到第一个未完成的任务
  for (const task of allTasks) {
    if (!completedTaskIds.includes(task._id.toString())) {
      return task
    }
  }

  // 所有任务都已完成
  return null
}

// 实例方法：验证答案
taskSchema.methods.validateAnswer = function(userAnswer) {
  if (!userAnswer) {
    return false
  }
  
  switch (this.type) {
    case 'text':
      if (this.answerMatchMode === 'exact') {
        return userAnswer.toString().trim().toLowerCase() === this.answer.toString().trim().toLowerCase()
      } else if (this.answerMatchMode === 'includes') {
        return userAnswer.toString().toLowerCase().includes(this.answer.toString().toLowerCase())
      } else if (this.answerMatchMode === 'regex') {
        try {
          const regex = new RegExp(this.answer, 'i')
          return regex.test(userAnswer.toString())
        } catch (error) {
          return false
        }
      }
      return false
      
    case 'number':
      const userNum = parseFloat(userAnswer)
      const correctNum = parseFloat(this.answer)
      return !isNaN(userNum) && !isNaN(correctNum) && userNum === correctNum
      
    case 'single_choice':
      return userAnswer === this.correctOptions[0]
      
    case 'multi_choice':
      if (!Array.isArray(userAnswer)) {
        return false
      }
      if (userAnswer.length !== this.correctOptions.length) {
        return false
      }
      return this.correctOptions.every(option => userAnswer.includes(option))
      
    default:
      return false
  }
}

module.exports = mongoose.model('Task', taskSchema)
