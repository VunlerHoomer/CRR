import request from './request'

// 获取活动区域列表
export const getActivityAreas = (activityId, userId = null) => {
  const params = userId ? { userId } : {}
  return request.get(`/task/areas/${activityId}`, { params })
}

// 获取区域任务列表
export const getAreaTasks = (areaId, userId = null) => {
  const params = userId ? { userId } : {}
  return request.get(`/task/area/${areaId}/tasks`, { params })
}

// 获取单个任务详情
export const getTaskDetail = (taskId) => {
  return request.get(`/task/${taskId}`)
}

// 提交任务答案
export const submitTaskAnswer = (taskId, answer, userId = null) => {
  const data = { answer }
  if (userId) {
    data.userId = userId
  }
  return request.post(`/task/${taskId}/submit`, data)
}

// 获取用户进度统计
export const getUserProgress = (activityId, userId = null) => {
  const params = userId ? { userId } : {}
  return request.get(`/task/progress/${activityId}`, { params })
}