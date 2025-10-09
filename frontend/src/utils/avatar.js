// 获取用户头像显示文本
export const getAvatarText = (user) => {
  if (!user) return 'U'
  
  // 优先使用nickname
  if (user.nickname && typeof user.nickname === 'string' && user.nickname.trim()) {
    return user.nickname.trim().charAt(0).toUpperCase()
  }
  
  // 其次使用username
  if (user.username && typeof user.username === 'string' && user.username.trim()) {
    return user.username.trim().charAt(0).toUpperCase()
  }
  
  // 最后使用phone
  if (user.phone && typeof user.phone === 'string' && user.phone.trim()) {
    return user.phone.trim().charAt(0)
  }
  
  // 默认返回U
  return 'U'
}

// 获取用户显示名称
export const getUserDisplayName = (user) => {
  if (!user) return '用户'
  
  if (user.nickname && typeof user.nickname === 'string' && user.nickname.trim()) {
    return user.nickname.trim()
  }
  
  if (user.username && typeof user.username === 'string' && user.username.trim()) {
    return user.username.trim()
  }
  
  if (user.phone && typeof user.phone === 'string' && user.phone.trim()) {
    return user.phone.trim()
  }
  
  return '用户'
}
