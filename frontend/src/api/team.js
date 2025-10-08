import request from './request'

// 获取用户当前队伍
export const getMyTeam = () => {
  return request.get('/team/my')
}

// 创建队伍
export const createTeam = (data) => {
  return request.post('/team/create', data)
}

// 生成邀请码
export const generateInvitationCode = () => {
  return request.post('/team/invitation-code')
}

// 通过邀请码加入队伍
export const joinTeamByCode = (invitationCode) => {
  return request.post('/team/join', { invitationCode })
}

// 退出队伍
export const leaveTeam = () => {
  return request.post('/team/leave')
}

// 更新队伍信息
export const updateTeamInfo = (data) => {
  return request.put('/team/update', data)
}
