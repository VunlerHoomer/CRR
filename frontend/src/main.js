import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user'
import performanceMonitor, { performanceUtils } from './utils/performance'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 性能优化：根据网络状态调整加载策略
const networkStrategy = performanceUtils.adaptiveLoading()

// 预连接重要域名
if (import.meta.env.PROD) {
  performanceUtils.preconnectDomain('https://crr-five.vercel.app')
}

// 应用启动时，如果有token，尝试获取用户信息
const userStore = useUserStore()
if (userStore.token && !userStore.user) {
  userStore.fetchUserInfo().catch(err => {
    console.error('初始化用户信息失败:', err)
  })
}

// 监控应用启动时间
const startTime = performance.now()
app.mount('#app')
const mountTime = performance.now() - startTime

// 记录应用挂载性能
performanceMonitor.measureComponent('App', mountTime)


