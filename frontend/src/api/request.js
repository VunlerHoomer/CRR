import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import performanceMonitor from '@/utils/performance'

// 请求缓存
const requestCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://crr-five.vercel.app/api',
  timeout: 10000,
  // 启用请求去重
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 确保config.method存在
    if (!config.method) {
      console.error('请求配置缺少method字段:', config)
      return Promise.reject(new Error('请求配置错误：缺少method字段'))
    }
    
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    // 添加缓存键
    const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`
    config.cacheKey = cacheKey
    
    // 记录请求开始时间
    config.startTime = Date.now()
    
    // 检查缓存
    if (config.method === 'get' && !config.skipCache) {
      const cached = requestCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // 返回一个模拟的axios响应对象，保持config完整性
        return Promise.resolve({
          data: cached.response,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config,
          request: {}
        })
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data, config } = response
    
    // 记录API性能
    if (config.startTime) {
      const duration = Date.now() - config.startTime
      performanceMonitor.measureAPI(config.url, config.method, duration)
    }
    
    // 缓存GET请求的响应
    if (config.method === 'get' && !config.skipCache && data.code === 200) {
      requestCache.set(config.cacheKey, {
        response: data,
        timestamp: Date.now()
      })
    }
    
    // 后端返回的数据结构：{ code: 200, message: '...', data: {...} }
    if (data.code === 200) {
      return data
    } else {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    const userStore = useUserStore()
    
    // 处理HTTP错误状态码
    if (error.response?.status === 401) {
      userStore.logout()
      ElMessage.error('登录已过期，请重新登录')
    } else if (error.response?.status === 403) {
      ElMessage.error('没有权限访问')
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.response?.status === 400) {
      // 处理400错误，显示后端返回的错误信息
      const errorMessage = error.response.data?.message || '请求参数错误'
      ElMessage.error(errorMessage)
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    
    return Promise.reject(error)
  }
)

// 重试机制
const retryRequest = async (config, retryCount = 0) => {
  const maxRetries = 3
  try {
    return await request(config)
  } catch (error) {
    if (retryCount < maxRetries && error.response?.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
      return retryRequest(config, retryCount + 1)
    }
    throw error
  }
}

// 清理过期缓存
const cleanExpiredCache = () => {
  const now = Date.now()
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      requestCache.delete(key)
    }
  }
}

// 定期清理缓存
setInterval(cleanExpiredCache, 60000) // 每分钟清理一次

// 添加缓存管理方法
export const cacheUtils = {
  // 清除特定缓存
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
  // 获取缓存大小
  getCacheSize: () => requestCache.size,
  // 强制刷新缓存
  refreshCache: (url) => {
    for (const key of requestCache.keys()) {
      if (key.includes(url)) {
        requestCache.delete(key)
      }
    }
  }
}

export default request
