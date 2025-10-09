// 获取用户头像显示文本
export const getAvatarText = (user) => {
  if (!user) return 'U'
  
  try {
    // 优先使用nickname
    if (user.nickname && typeof user.nickname === 'string' && user.nickname.trim()) {
      const trimmed = user.nickname.trim()
      const firstChar = trimmed.charAt(0)
      // 确保firstChar是字符串类型再调用toUpperCase
      return String(firstChar).toUpperCase()
    }
    
    // 其次使用username
    if (user.username && typeof user.username === 'string' && user.username.trim()) {
      const trimmed = user.username.trim()
      const firstChar = trimmed.charAt(0)
      // 确保firstChar是字符串类型再调用toUpperCase
      return String(firstChar).toUpperCase()
    }
    
    // 最后使用phone
    if (user.phone && typeof user.phone === 'string' && user.phone.trim()) {
      const trimmed = user.phone.trim()
      const firstChar = trimmed.charAt(0)
      // 电话号码通常不需要转大写，但确保返回字符串
      return String(firstChar)
    }
    
    // 默认返回U
    return 'U'
  } catch (error) {
    console.warn('getAvatarText error:', error)
    return 'U'
  }
}

// 获取用户显示名称
export const getUserDisplayName = (user) => {
  if (!user) return '用户'
  
  try {
    if (user.nickname && typeof user.nickname === 'string' && user.nickname.trim()) {
      return String(user.nickname.trim())
    }
    
    if (user.username && typeof user.username === 'string' && user.username.trim()) {
      return String(user.username.trim())
    }
    
    if (user.phone && typeof user.phone === 'string' && user.phone.trim()) {
      return String(user.phone.trim())
    }
    
    return '用户'
  } catch (error) {
    console.warn('getUserDisplayName error:', error)
    return '用户'
  }
}
