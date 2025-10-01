import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const adminRequest = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'https://crr-five.vercel.app/api') + '/admin',
  timeout: 30000  // 增加到 30 秒
})

// 请求拦截器
adminRequest.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
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
    return response
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
      const response = await adminRequest.post('/auth/login', { username, password })
      const data = response.data
      
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
      const response = await adminRequest.get('/auth/profile')
      const data = response.data
      
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
