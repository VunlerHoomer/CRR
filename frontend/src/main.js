import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user'

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

// 应用启动时，如果有token，尝试获取用户信息
const userStore = useUserStore()
if (userStore.token && !userStore.user) {
  userStore.fetchUserInfo().catch(err => {
    console.error('初始化用户信息失败:', err)
  })
}

app.mount('#app')


