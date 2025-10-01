const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

// 管理员认证中间件
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问令牌不存在'
      })
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development'
    )
    
    // 检查是否是管理员token
    if (!decoded.isAdmin) {
      return res.status(403).json({
        code: 403,
        message: '需要管理员权限'
      })
    }

    const admin = await Admin.findById(decoded.id)
    
    if (!admin) {
      return res.status(401).json({
        code: 401,
        message: '管理员不存在'
      })
    }

    if (!admin.isActive) {
      return res.status(403).json({
        code: 403,
        message: '管理员账号已被禁用'
      })
    }

    req.admin = admin
    next()
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '令牌无效或已过期'
    })
  }
}

// 检查特定权限
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin.hasPermission(permission)) {
      return res.status(403).json({
        code: 403,
        message: '没有权限执行此操作'
      })
    }
    next()
  }
}

module.exports = {
  adminAuth,
  checkPermission
}
