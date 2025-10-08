// 性能监控工具
class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.observers = []
  }

  // 初始化性能监控
  init() {
    this.measurePageLoad()
    this.observeLCP()
    this.observeFID()
    this.observeCLS()
    this.observeTTFB()
  }

  // 测量页面加载性能
  measurePageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0]
        
        this.metrics = {
          ...this.metrics,
          // DNS解析时间
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          // TCP连接时间
          tcp: navigation.connectEnd - navigation.connectStart,
          // 请求响应时间
          request: navigation.responseEnd - navigation.requestStart,
          // DOM解析时间
          domParse: navigation.domContentLoadedEventEnd - navigation.responseEnd,
          // 页面完全加载时间
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          // 首次内容绘制
          fcp: this.getFCP(),
          // 最大内容绘制
          lcp: this.metrics.lcp || 0
        }

        console.log('页面性能指标:', this.metrics)
        this.sendMetrics()
      }, 0)
    })
  }

  // 获取首次内容绘制时间
  getFCP() {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
    return fcpEntry ? fcpEntry.startTime : 0
  }

  // 观察最大内容绘制
  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    }
  }

  // 观察首次输入延迟
  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime
        })
      })
      
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    }
  }

  // 观察累积布局偏移
  observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        this.metrics.cls = clsValue
      })
      
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    }
  }

  // 观察首字节时间
  observeTTFB() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const navigation = entries[0]
        if (navigation) {
          this.metrics.ttfb = navigation.responseStart - navigation.requestStart
        }
      })
      
      observer.observe({ entryTypes: ['navigation'] })
      this.observers.push(observer)
    }
  }

  // 测量API请求性能
  measureAPI(url, method, duration) {
    if (!this.metrics.apiCalls) {
      this.metrics.apiCalls = []
    }
    
    this.metrics.apiCalls.push({
      url,
      method,
      duration,
      timestamp: Date.now()
    })

    // 只保留最近50个API调用记录
    if (this.metrics.apiCalls.length > 50) {
      this.metrics.apiCalls = this.metrics.apiCalls.slice(-50)
    }
  }

  // 测量组件渲染性能
  measureComponent(name, renderTime) {
    if (!this.metrics.components) {
      this.metrics.components = []
    }
    
    this.metrics.components.push({
      name,
      renderTime,
      timestamp: Date.now()
    })
  }

  // 获取性能报告
  getReport() {
    const report = {
      ...this.metrics,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      url: window.location.href
    }

    // 计算平均API响应时间
    if (this.metrics.apiCalls && this.metrics.apiCalls.length > 0) {
      const totalDuration = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0)
      report.avgApiResponseTime = totalDuration / this.metrics.apiCalls.length
    }

    return report
  }

  // 发送性能数据到服务器
  sendMetrics() {
    // 只在生产环境发送性能数据
    if (import.meta.env.PROD) {
      try {
        // 这里可以发送到性能监控服务
        console.log('发送性能数据:', this.getReport())
        // fetch('/api/performance', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(this.getReport())
        // }).catch(console.error)
      } catch (error) {
        console.error('发送性能数据失败:', error)
      }
    }
  }

  // 清理观察器
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor()

// 导出性能监控工具
export default performanceMonitor

// 性能优化工具函数
export const performanceUtils = {
  // 防抖函数
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // 延迟加载函数
  lazyLoad(importFn) {
    return () => importFn()
  },

  // 预加载资源
  preloadResource(url, type = 'script') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = type
    document.head.appendChild(link)
  },

  // 预连接域名
  preconnectDomain(url) {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = url
    document.head.appendChild(link)
  },

  // 图片预加载
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = src
    })
  },

  // 批量预加载图片
  preloadImages(urls) {
    return Promise.all(urls.map(url => this.preloadImage(url)))
  },

  // 检查网络状态
  getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  },

  // 根据网络状态调整加载策略
  adaptiveLoading() {
    const networkInfo = this.getNetworkInfo()
    
    if (networkInfo) {
      // 慢网络时启用数据节省模式
      if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
        document.body.classList.add('slow-network')
        return { lowQuality: true, lazyLoad: true }
      }
      
      // 快网络时启用高质量模式
      if (networkInfo.effectiveType === '4g') {
        document.body.classList.add('fast-network')
        return { highQuality: true, preload: true }
      }
    }
    
    return { normal: true }
  }
}

// 初始化性能监控
if (typeof window !== 'undefined') {
  performanceMonitor.init()
}
