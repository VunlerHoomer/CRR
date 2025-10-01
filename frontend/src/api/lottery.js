import request from './request'

// 获取抽签列表
export const getLotteryList = (params) => {
  return request.get('/lottery/list', { params })
}

// 执行抽签
export const drawLottery = (lotteryId) => {
  return request.post('/lottery/draw', { lotteryId })
}

// 获取抽签记录
export const getLotteryHistory = (params) => {
  return request.get('/lottery/history', { params })
}
