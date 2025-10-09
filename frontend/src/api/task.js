import request from './request'

// 获取活动区域列表
export const getActivityAreas = (activityId) => {
  return request.get(`/task/areas/${activityId}`)
}

// 获取区域任务列表
export const getAreaTasks = (areaId) => {
  return request.get(`/task/area/${areaId}/tasks`)
}

// 获取单个任务详情
export const getTaskDetail = (taskId) => {
  return request.get(`/task/${taskId}`)
}

// 提交任务答案
export const submitTaskAnswer = (taskId, answer) => {
  return request.post(`/task/${taskId}/submit`, { answer })
}

// 获取用户进度统计
export const getUserProgress = (activityId) => {
  return request.get(`/task/progress/${activityId}`)
}