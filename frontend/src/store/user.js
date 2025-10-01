import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, getUserInfo } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const loginUser = async (loginData) => {
    loading.value = true
    try {
      const response = await login(loginData)
      // 后端返回: { code: 200, message: '...', data: { token, user } }
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 注册
  const registerUser = async (userData) => {
    loading.value = true
    try {
      const response = await register(userData)
      // 后端返回: { code: 200, message: '...', data: { token, user } }
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const response = await getUserInfo()
      // 后端返回: { code: 200, message: '...', data: { user } }
      user.value = response.data.user
      return response
    } catch (error) {
      logout()
      throw error
    }
  }

  // 登出
  const logout = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  // 更新用户信息
  const updateUser = (userData) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
    }
  }

  return {
    user,
    token,
    loading,
    isLoggedIn,
    loginUser,
    registerUser,
    fetchUserInfo,
    logout,
    updateUser
  }
})
