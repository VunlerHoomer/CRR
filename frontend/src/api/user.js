import request from './request'

// 发送验证码
export const sendSmsCode = (phone) => {
  return request.post('/auth/send-sms', { phone })
}

// 登录
export const login = (loginData) => {
  return request.post('/auth/login', loginData)
}

// 注册
export const register = (userData) => {
  return request.post('/auth/register', userData)
}

// 获取用户信息
export const getUserInfo = () => {
  return request.get('/user/profile')
}

// 更新用户信息
export const updateUserInfo = (userData) => {
  return request.put('/user/profile', userData)
}

// 获取用户答题记录
export const getUserQuizHistory = (params) => {
  return request.get('/user/quiz-history', { params })
}

// 获取用户积分记录
export const getUserPointsHistory = (params) => {
  return request.get('/user/points-history', { params })
}
