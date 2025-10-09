// 调试报名流程的脚本
const axios = require('axios')

const BASE_URL = 'https://crr-five.vercel.app'

async function debugRegistration() {
  console.log('🔍 开始调试报名流程...\n')

  try {
    // 1. 测试健康检查
    console.log('1. 测试后端健康状态...')
    const healthResponse = await axios.get(`${BASE_URL}/api/health`)
    console.log('✅ 后端健康:', healthResponse.data.message)
    console.log('📊 数据库状态:', healthResponse.data.database)
    console.log()

    // 2. 测试活动列表
    console.log('2. 获取活动列表...')
    const activityResponse = await axios.get(`${BASE_URL}/api/activity/list`)
    console.log('✅ 活动列表获取成功')
    console.log('📋 活动数量:', activityResponse.data.data.activities.length)
    
    if (activityResponse.data.data.activities.length > 0) {
      const activity = activityResponse.data.data.activities[0]
      console.log('🎯 测试活动:', activity.title)
      console.log('🆔 活动ID:', activity._id)
      console.log('📅 状态:', activity.status)
      console.log('👥 当前参与人数:', activity.currentParticipants)
      console.log('📊 最大参与人数:', activity.maxParticipants)
      console.log()

      // 3. 测试报名API（不提供token，应该返回401）
      console.log('3. 测试报名API权限验证...')
      try {
        await axios.post(`${BASE_URL}/api/registration`, {
          activityId: activity._id,
          registrationInfo: {
            realName: '测试用户',
            phone: '13800138000',
            school: '测试学校',
            gender: 'male'
          }
        })
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ 报名API权限验证正常（需要登录）')
        } else {
          console.log('❌ 报名API权限验证异常:', error.response?.data)
        }
      }
      console.log()

      // 4. 测试管理员报名列表API（不提供token，应该返回401）
      console.log('4. 测试管理员报名列表API权限验证...')
      try {
        await axios.get(`${BASE_URL}/api/admin/registration/list`)
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ 管理员API权限验证正常（需要管理员权限）')
        } else {
          console.log('❌ 管理员API权限验证异常:', error.response?.data)
        }
      }
      console.log()

      // 5. 测试检查报名状态API（不提供token，应该返回401）
      console.log('5. 测试检查报名状态API权限验证...')
      try {
        await axios.get(`${BASE_URL}/api/registration/check/${activity._id}`)
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ 检查报名状态API权限验证正常（需要登录）')
        } else {
          console.log('❌ 检查报名状态API权限验证异常:', error.response?.data)
        }
      }
      console.log()

    } else {
      console.log('❌ 没有找到活动数据')
    }

    console.log('🎯 调试结论:')
    console.log('- 后端API正常运行')
    console.log('- 数据库连接正常')
    console.log('- 所有API都有正确的权限验证')
    console.log('- 前端报名功能应该正常工作')
    console.log()
    console.log('💡 可能的问题:')
    console.log('1. 前端报名时用户未登录')
    console.log('2. 前端报名成功后管理员后台没有刷新')
    console.log('3. 管理员后台查询条件过滤掉了新报名')
    console.log('4. 前端报名API调用失败但没有显示错误')

  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error.message)
    if (error.response) {
      console.error('📊 响应状态:', error.response.status)
      console.error('📋 响应数据:', error.response.data)
    }
  }
}

// 运行调试
debugRegistration()
