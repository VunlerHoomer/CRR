import request from './request'

// 获取任务列表
export const getTaskList = (params) => {
  return request.get('/task/list', { params })
}

// 获取任务详情
export const getTaskDetail = (taskId) => {
  return request.get(`/task/${taskId}`)
}

// 获取区域列表
export const getAreaList = () => {
  return request.get('/task/areas/list')
}
