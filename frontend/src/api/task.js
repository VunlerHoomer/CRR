import request from './request'

// 获取活动的任务列表
export const getActivityTasks = (activityId) => {
  return request.get(`/task/activity/${activityId}`)
}

// 开始任务
export const startTask = (taskId) => {
  return request.post(`/task/${taskId}/start`)
}

// 提交任务答案
export const submitTask = (taskId, data) => {
  return request.post(`/task/${taskId}/submit`, data)
}

// 获取用户的任务进度
export const getTaskProgress = (activityId) => {
  return request.get(`/task/my-progress/${activityId}`)
}