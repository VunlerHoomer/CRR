const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // 记录错误日志
  console.error('❌ 错误详情:', err)

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = {
      message,
      code: 400
    }
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field} 已存在`
    error = {
      message,
      code: 400
    }
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: '无效的访问令牌',
      code: 401
    }
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: '访问令牌已过期',
      code: 401
    }
  }

  res.status(error.code || 500).json({
    code: error.code || 500,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

module.exports = errorHandler
