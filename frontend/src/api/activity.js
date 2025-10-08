import request from './request'

// 获取活动列表
export const getActivityList = (params) => {
  return request.get('/activity/list', { params })
}

// 获取活动详情
export const getActivityDetail = (id) => {
  return request.get(`/activity/${id}`)
}

// 报名活动
export const registerActivity = (id) => {
  return request.post(`/activity/${id}/register`)
}

// 取消报名
export const cancelActivity = (id) => {
  return request.post(`/activity/${id}/cancel`)
}
