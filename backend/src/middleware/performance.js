const compression = require('compression')
const helmet = require('helmet')

// 启用gzip压缩
const enableCompression = compression({
  level: 6,
  threshold: 1024, // 只压缩大于1KB的响应
  filter: (req, res) => {
    // 只压缩特定类型的响应
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
})

// 安全头设置
const securityHeaders = helmet({
  // 启用CSP
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  // 启用HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  // 禁用X-Powered-By头
  hidePoweredBy: true,
  // 防止XSS攻击
  xssFilter: true,
  // 防止点击劫持
  frameguard: { action: 'deny' },
  // 防止MIME类型嗅探
  noSniff: true,
  // 防止DNS预取
  dnsPrefetchControl: true
})

// 请求缓存中间件
const requestCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟

const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next()
    }
    
    const cacheKey = `${req.originalUrl}:${JSON.stringify(req.query)}`
    const cached = requestCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data)
    }
    
    // 保存原始json方法
    const originalJson = res.json
    
    // 重写json方法以捕获响应数据
    res.json = function(data) {
      // 只缓存成功的响应
      if (data.code === 200) {
        requestCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
      }
      return originalJson.call(this, data)
    }
    
    next()
  }
}

// 清理过期缓存的定时任务
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) {
      requestCache.delete(key)
    }
  }
}, 60000) // 每分钟清理一次

// 响应时间中间件
const responseTime = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    res.setHeader('X-Response-Time', `${duration}ms`)
    
    // 记录慢请求
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`)
    }
  })
  
  next()
}

// 请求限流中间件
const rateLimit = require('express-rate-limit')

const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      code: 429,
      message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
  })
}

// API限流
const apiLimiter = createRateLimit(15 * 60 * 1000, 100) // 15分钟内最多100次请求

// 登录限流
const loginLimiter = createRateLimit(15 * 60 * 1000, 5) // 15分钟内最多5次登录尝试

// 上传限流
const uploadLimiter = createRateLimit(60 * 1000, 10) // 1分钟内最多10次上传

module.exports = {
  enableCompression,
  securityHeaders,
  cacheMiddleware,
  responseTime,
  apiLimiter,
  loginLimiter,
  uploadLimiter,
  // 缓存管理方法
  clearCache: (pattern) => {
    if (pattern) {
      for (const key of requestCache.keys()) {
        if (key.includes(pattern)) {
          requestCache.delete(key)
        }
      }
    } else {
      requestCache.clear()
    }
  },
  getCacheStats: () => ({
    size: requestCache.size,
    keys: Array.from(requestCache.keys())
  })
}
