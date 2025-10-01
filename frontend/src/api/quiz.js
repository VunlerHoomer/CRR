import request from './request'

// 获取题目列表
export const getQuizQuestions = (params) => {
  return request.get('/quiz/questions', { params })
}

// 提交答案
export const submitQuizAnswer = (data) => {
  return request.post('/quiz/submit', data)
}

// 获取答题统计
export const getQuizStats = () => {
  return request.get('/quiz/stats')
}
