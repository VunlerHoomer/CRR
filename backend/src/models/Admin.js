const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: ['manage_quiz', 'manage_lottery', 'manage_users', 'view_stats', 'all']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  lastLoginIp: {
    type: String
  }
}, {
  timestamps: true
})

// 密码加密中间件
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// 验证密码方法
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// 检查权限
adminSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true
  if (this.permissions.includes('all')) return true
  return this.permissions.includes(permission)
}

// 转换为JSON时不包含敏感信息
adminSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password
    return ret
  }
})

module.exports = mongoose.model('Admin', adminSchema)
