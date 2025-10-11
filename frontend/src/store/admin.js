import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const adminRequest = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'https://crr-five.vercel.app/api'),
  timeout: 30000  // 增加到 30 秒
})

// 请求拦截器
adminRequest.interceptors.request.use(
  (config) => {
    // 确保config.method存在
    if (!config.method) {
      console.error('请求配置缺少method字段:', config)
      return Promise.reject(new Error('请求配置错误：缺少method字段'))
    }
    
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
adminRequest.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // 后端返回的数据结构：{ code: 200, message: '...', data: {...} }
    if (data.code === 200) {
      return data
    } else {
      // 使用Element Plus的消息提示
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.error(data.message || '请求失败')
      })
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除登录状态
      localStorage.removeItem('adminToken')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export const useAdminStore = defineStore('admin', () => {
  const admin = ref(null)
  const token = ref(localStorage.getItem('adminToken') || '')
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const login = async (username, password) => {
    loading.value = true
    try {
      const data = await adminRequest.post('/admin/auth/login', { username, password })
      
      if (data.code === 200) {
        token.value = data.data.token
        admin.value = data.data.admin
        localStorage.setItem('adminToken', data.data.token)
        return data
      } else {
        throw new Error(data.message || '登录失败')
      }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取管理员信息
  const fetchAdminInfo = async () => {
    if (!token.value) return
    try {
      const data = await adminRequest.get('/admin/auth/profile')
      
      if (data.code === 200) {
        admin.value = data.data.admin
        return data
      }
    } catch (error) {
      logout()
      throw error
    }
  }

  // 登出
  const logout = () => {
    admin.value = null
    token.value = ''
    localStorage.removeItem('adminToken')
  }

  // API请求方法
  const request = {
    get: (url, config) => adminRequest.get(url, config),
    post: (url, data, config) => adminRequest.post(url, data, config),
    put: (url, data, config) => adminRequest.put(url, data, config),
    patch: (url, data, config) => adminRequest.patch(url, data, config),
    delete: (url, config) => adminRequest.delete(url, config)
  }

  return {
    admin,
    token,
    loading,
    isLoggedIn,
    login,
    fetchAdminInfo,
    logout,
    request
  }
})
