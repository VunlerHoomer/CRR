import request from './request'

// 报名活动
export const registerActivity = (data) => {
  return request.post('/registration', data)
}

// 获取我的报名记录
export const getMyRegistrations = (params) => {
  return request.get('/registration/my', { params })
}

// 检查是否已报名
export const checkRegistration = (activityId) => {
  return request.get(`/registration/check/${activityId}`)
}

// 取消报名
export const cancelRegistration = (id) => {
  return request.delete(`/registration/${id}`)
}

