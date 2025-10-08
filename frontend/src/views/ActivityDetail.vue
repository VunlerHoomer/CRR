<template>
  <div class="activity-detail">
    <div class="activity-header">
      <el-button @click="goBack" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>{{ activity.title }}</h1>
    </div>

    <div class="activity-content">
      <div class="activity-info">
        <div class="activity-banner-large">
          <img :src="activity.banner" :alt="activity.title" />
        </div>
        
        <div class="activity-description">
          <h2>活动描述</h2>
          <p>{{ activity.description }}</p>
        </div>

        <div class="activity-details">
          <h2>活动详情</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">活动时间：</span>
              <span class="value">{{ activity.startTime }} - {{ activity.endTime }}</span>
            </div>
            <div class="detail-item">
              <span class="label">活动地点：</span>
              <span class="value">{{ activity.location }}</span>
            </div>
            <div class="detail-item">
              <span class="label">参与人数：</span>
              <span class="value">{{ activity.participants }}/{{ activity.maxParticipants }}</span>
            </div>
            <div class="detail-item">
              <span class="label">难度等级：</span>
              <span class="value">{{ activity.difficulty }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="activity-actions">
        <el-button 
          v-if="!activity.registered" 
          type="primary" 
          size="large"
          @click="registerActivity"
          :loading="registering"
        >
          立即报名
        </el-button>
        <el-button 
          v-else 
          type="success" 
          size="large"
          disabled
        >
          已报名
        </el-button>
        
        <el-button type="info" size="large" @click="shareActivity">
          分享活动
        </el-button>

        <!-- 任务管理入口 - 仅对有权限的用户显示 -->
        <el-button 
          v-if="canAccessTaskManagement"
          type="warning" 
          size="large"
          @click="goToTaskManagement"
        >
          任务管理
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activity = ref({
  id: 1,
  title: '溯槎问帙',
  description: '溯槎问帙，探索未知的奇幻世界。在这场充满神秘色彩的冒险中，你将穿越时空的漩涡，寻找失落的宝藏，揭开古老的秘密。准备好迎接这场充满挑战的奇幻之旅吧！',
  banner: '/images/activities/suchawenzhi.jpg',
  startTime: '2024-01-15 09:00',
  endTime: '2024-01-15 18:00',
  location: '上海市徐汇区',
  participants: 45,
  maxParticipants: 150,
  difficulty: '中等',
  registered: true
})

const registering = ref(false)

// 计算用户是否有任务管理权限
const canAccessTaskManagement = computed(() => {
  return userStore.user?.canAccessTaskManagement || false
})

const goBack = () => {
  router.back()
}

const registerActivity = async () => {
  registering.value = true
  try {
    // 这里应该调用API进行报名
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    activity.value.registered = true
    ElMessage.success('报名成功！')
  } catch (error) {
    ElMessage.error('报名失败，请稍后重试')
  } finally {
    registering.value = false
  }
}

const shareActivity = () => {
  ElMessage.success('活动链接已复制到剪贴板')
}

// 跳转到任务管理页面
const goToTaskManagement = () => {
  router.push(`/activity/${route.params.id}/tasks`)
}

onMounted(() => {
  // 根据路由参数加载活动详情
  const activityId = route.params.id
  console.log('加载活动详情:', activityId)
})
</script>

<style scoped>
.activity-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.activity-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
}

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.activity-banner-large img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 12px;
}

.activity-description h2,
.activity-details h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 16px;
}

.activity-description p {
  color: #666;
  line-height: 1.6;
  font-size: 1.1rem;
}

.detail-grid {
  display: grid;
  gap: 16px;
}

.detail-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #333;
  min-width: 100px;
}

.value {
  color: #666;
}

.activity-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
}

.activity-actions .el-button {
  height: 50px;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .activity-content {
    grid-template-columns: 1fr;
  }
  
  .activity-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .activity-actions {
    position: sticky;
    bottom: 20px;
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  }
}
</style>
