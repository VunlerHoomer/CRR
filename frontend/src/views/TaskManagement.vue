<template>
  <div class="task-management">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <div class="nav-bar">
        <div class="nav-content">
          <div class="nav-left">
            <el-button @click="goBack" class="back-button" text>
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
          </div>
          <div class="nav-center">
            <div class="nav-logo">
              <el-icon :size="24"><Box /></el-icon>
            </div>
          </div>
          <div class="nav-right"></div>
        </div>
      </div>
    </div>

    <!-- 权限检查加载状态 -->
    <div v-if="permissionLoading" class="permission-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在检查权限...</span>
    </div>

    <!-- 权限被拒绝显示 -->
    <div v-else-if="!hasPermission" class="permission-denied">
      <div class="denied-content">
        <el-icon size="64" color="#f56c6c"><Warning /></el-icon>
        <h2>访问受限</h2>
        <p>{{ permissionError }}</p>
        <div class="denied-actions">
          <el-button type="primary" @click="goBack">返回活动详情</el-button>
          <el-button v-if="permissionError.includes('尚未报名')" @click="goToActivityDetail">
            去报名
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空白内容区域 - 待重新构建 -->
    <div v-else class="content-area">
      <div class="empty-state">
        <el-icon size="80" color="#c0c4cc"><Box /></el-icon>
        <h2>任务管理</h2>
        <p>功能正在重新构建中...</p>
        <p class="activity-info">活动ID: {{ activityId }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Box, Loading, Warning } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { checkRegistration } from '@/api/registration'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 权限控制
const hasPermission = ref(false)
const permissionLoading = ref(true)
const permissionError = ref('')

// 活动ID
const activityId = computed(() => route.params.id)

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到活动详情页面报名
const goToActivityDetail = () => {
  router.push(`/activity/${activityId.value}`)
}

// 检查任务管理权限
const checkTaskPermission = async () => {
  try {
    permissionLoading.value = true
    
    if (!activityId.value || activityId.value === 'undefined' || activityId.value === 'null') {
      throw new Error('活动ID无效')
    }
    
    if (!userStore.isLoggedIn) {
      throw new Error('请先登录')
    }
    
    const response = await checkRegistration(activityId.value)
    
    if (response && response.code === 200 && response.data && response.data.registration) {
      const registration = response.data.registration
      
      // 检查报名状态和任务权限
      if (registration.status === 'approved' && registration.canAccessTaskManagement) {
        hasPermission.value = true
        permissionError.value = ''
      } else if (registration.status === 'pending') {
        permissionError.value = '您的报名正在审核中，请等待管理员审核通过'
        hasPermission.value = false
      } else if (registration.status === 'rejected') {
        permissionError.value = '您的报名已被拒绝，无法访问任务管理'
        hasPermission.value = false
      } else if (!registration.canAccessTaskManagement) {
        permissionError.value = '您没有任务管理权限，请联系管理员'
        hasPermission.value = false
      }
    } else {
      permissionError.value = '您尚未报名此活动，请先报名'
      hasPermission.value = false
    }
  } catch (error) {
    console.error('❌ 权限检查失败:', error)
    permissionError.value = error.response?.data?.message || error.message || '权限检查失败'
    hasPermission.value = false
  } finally {
    permissionLoading.value = false
  }
}

onMounted(async () => {
  try {
    // 检查任务管理权限
    await checkTaskPermission()
    
    console.log('📋 任务管理页面加载完成，活动ID:', activityId.value)
  } catch (error) {
    console.error('❌ 任务管理页面加载失败:', error)
    ElMessage.error('页面加载失败: ' + error.message)
  }
})
</script>

<style scoped>
.task-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
}

/* 顶部导航栏 */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.nav-bar {
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.nav-left, .nav-right {
  flex: 1;
}

.nav-center {
  flex: 2;
  display: flex;
  justify-content: center;
}

.nav-logo {
  display: flex;
  align-items: center;
  color: #409eff;
  font-weight: bold;
}

.back-button {
  color: #666;
  font-size: 16px;
}

.back-button:hover {
  color: #409eff;
}

/* 权限检查样式 */
.permission-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  color: #666;
  font-size: 16px;
}

.permission-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.denied-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.denied-content h2 {
  color: #f56c6c;
  margin: 20px 0 16px 0;
  font-size: 24px;
}

.denied-content p {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
  font-size: 16px;
}

.denied-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 内容区域 */
.content-area {
  padding: 40px 20px;
  min-height: 60vh;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.empty-state h2 {
  color: #333;
  margin: 20px 0 16px 0;
  font-size: 28px;
}

.empty-state p {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
  font-size: 16px;
}

.activity-info {
  color: #999;
  font-size: 14px;
  margin-top: 20px;
  padding: 10px 20px;
  background: #f5f7fa;
  border-radius: 6px;
}
</style>