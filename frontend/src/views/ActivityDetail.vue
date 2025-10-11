<template>
  <div class="activity-detail" v-loading="loading">
    <div v-if="activity">
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
          <LazyImage 
            :src="activity.banner" 
            :alt="activity.title"
            width="100%"
            height="300px"
          />
        </div>
        
        <div class="activity-description">
          <h2>活动描述</h2>
          <p>{{ activity.description }}</p>
        </div>

        <!-- 溯槎问帙地图 -->
        <div class="activity-map">
          <h2>溯槎问帙地图</h2>
          <div class="map-container">
            <img 
              src="/images/activities/suchawenzhi-map.png" 
              alt="溯槎问帙活动地图"
              class="activity-map-image"
            />
            <div class="map-overlay">
              <div class="map-legend">
                <h3>地图说明</h3>
                <ul>
                  <li>🏛️ 人大江市 - 起点</li>
                  <li>🏯 传统建筑 - 检查点</li>
                  <li>🎓 學大吳東 - 终点</li>
                  <li>🏢 现代建筑 - 任务点</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="activity-details">
          <h2>活动详情</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">活动时间：</span>
              <span class="value">{{ formatDateTime(activity.startTime) }} - {{ formatDateTime(activity.endTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">活动地点：</span>
              <span class="value">{{ activity.location }}</span>
            </div>
            <div class="detail-item">
              <span class="label">参与人数：</span>
              <span class="value">{{ activity.currentParticipants || 0 }}/{{ activity.maxParticipants }}</span>
            </div>
            <div class="detail-item">
              <span class="label">难度等级：</span>
              <span class="value">{{ activity.difficulty }}</span>
            </div>
            <div class="detail-item">
              <span class="label">报名截止：</span>
              <span class="value">{{ formatDateTime(activity.registrationDeadline) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="activity-actions">
        <el-button 
          v-if="!registrationInfo.isRegistered" 
          type="primary" 
          size="large"
          @click="showRegistrationDialog = true"
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
        
        <!-- 任务管理入口 -->
        <el-button 
          v-if="registrationInfo.isRegistered"
          type="warning" 
          size="large"
          @click="goToTaskManagement"
        >
          <el-icon><Box /></el-icon>
          任务管理
        </el-button>

      </div>
    </div>

    <!-- 报名对话框 -->
    <el-dialog 
      v-model="showRegistrationDialog" 
      title="活动报名" 
      width="500px"
    >
      <el-form 
        :model="registrationForm" 
        :rules="registrationRules"
        ref="registrationFormRef"
        label-width="100px"
      >
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="registrationForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registrationForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="学校" prop="school">
          <el-input v-model="registrationForm.school" placeholder="请输入学校名称" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="registrationForm.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registrationForm.email" placeholder="请输入邮箱（可选）" />
        </el-form-item>
        <el-form-item label="备注" prop="note">
          <el-input 
            v-model="registrationForm.note" 
            type="textarea" 
            :rows="3"
            placeholder="其他需要说明的信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegistrationDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRegistration" :loading="registering">
          确认报名
        </el-button>
      </template>
    </el-dialog>
    </div>
    
    <!-- 活动不存在时的显示 -->
    <div v-else class="activity-not-found">
      <div class="not-found-content">
        <h2 style="color: #d73a49; text-align: center; margin-bottom: 20px;">加载失败</h2>
        <p style="color: #666; text-align: center; margin-bottom: 30px;">
          活动信息加载失败，请检查网络连接或稍后重试
        </p>
        <div style="text-align: center;">
          <el-button type="primary" @click="fetchActivityDetail">重新加载</el-button>
          <el-button @click="goBack">返回活动列表</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Box } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import LazyImage from '@/components/LazyImage.vue'
import { registerActivity as registerActivityAPI, checkRegistration } from '@/api/registration'
import { getActivityDetail } from '@/api/activity'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activity = ref(null)
const loading = ref(true)

const registering = ref(false)
const showRegistrationDialog = ref(false)
const registrationFormRef = ref()

// 报名信息
const registrationInfo = ref({
  isRegistered: false,
  registration: null
})

// 报名表单
const registrationForm = ref({
  realName: '',
  phone: '',
  school: '',
  gender: '',
  email: '',
  note: ''
})

// 表单验证规则
const registrationRules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  school: [
    { required: true, message: '请输入学校名称', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
}

const goBack = () => {
  router.back()
}

// 获取活动详情
const fetchActivityDetail = async () => {
  try {
    loading.value = true
    const activityId = route.params.id
    
    if (!activityId || activityId === 'undefined' || activityId === 'null') {
      ElMessage.error('活动ID无效')
      router.push('/activity-center')
      return
    }
    
    console.log('🔄 获取活动详情，ID:', activityId)
    const response = await getActivityDetail(activityId)
    console.log('📊 活动详情响应:', response)
    
    if (response.code === 200 && response.data && response.data.activity) {
      activity.value = response.data.activity
      console.log('✅ 活动详情加载成功:', activity.value.title)
    } else {
      console.error('❌ 活动详情响应异常:', response)
      activity.value = null
    }
  } catch (error) {
    console.error('❌ 获取活动详情失败:', error)
    activity.value = null
    ElMessage.error('获取活动详情失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 检查报名状态
const checkRegistrationStatus = async () => {
  try {
    const activityId = route.params.id
    if (!activityId || activityId === 'undefined' || activityId === 'null') return
    
    const response = await checkRegistration(activityId)
    if (response.code === 200) {
      registrationInfo.value = {
        isRegistered: response.data.isRegistered,
        registration: response.data.registration
      }
    }
  } catch (error) {
    console.error('检查报名状态失败:', error)
  }
}

// 提交报名
const submitRegistration = async () => {
  if (!registrationFormRef.value) return
  
  const activityId = route.params.id
  if (!activityId || activityId === 'undefined' || activityId === 'null') {
    ElMessage.error('活动ID无效')
    return
  }
  
  // 检查用户登录状态
  if (!userStore.isLoggedIn) {
    ElMessage.error('请先登录后再报名')
    router.push('/login')
    return
  }
  
  try {
    await registrationFormRef.value.validate()
    
    registering.value = true
    
    console.log('📝 开始报名:', {
      activityId,
      user: userStore.user?.username,
      isLoggedIn: userStore.isLoggedIn,
      hasToken: !!userStore.token
    })
    
    const response = await registerActivityAPI({
      activityId: activityId,
      registrationInfo: registrationForm.value
    })
    
    console.log('✅ 报名API响应:', response)
    
    if (response.code === 200) {
      ElMessage.success('报名成功！管理员将在后台看到您的报名信息。')
      showRegistrationDialog.value = false
      
      // 重置表单
      registrationFormRef.value.resetFields()
      
      // 刷新报名状态
      await checkRegistrationStatus()
      
      console.log('🎉 报名流程完成')
    }
  } catch (error) {
    console.error('❌ 报名失败:', error)
    
    if (error.name !== 'ValidationError') {
      let errorMessage = '报名失败，请稍后重试'
      
      if (error.response?.status === 401) {
        errorMessage = '登录已过期，请重新登录'
        userStore.logout()
        router.push('/login')
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || '报名信息有误'
      } else if (error.response?.status === 500) {
        errorMessage = '服务器错误，请稍后重试'
      }
      
      ElMessage.error(errorMessage)
    }
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


// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  // 获取活动详情
  await fetchActivityDetail()
  
  // 检查报名状态
  if (userStore.isLoggedIn && activity.value) {
    await checkRegistrationStatus()
  }
  
  // 从用户信息中自动填充部分表单
  if (userStore.user) {
    registrationForm.value.phone = userStore.user.phone || ''
    registrationForm.value.school = userStore.user.school || ''
    registrationForm.value.gender = userStore.user.gender || ''
    registrationForm.value.email = userStore.user.email || ''
  }
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

/* 溯槎问帙地图样式 */
.activity-map {
  margin: 30px 0;
}

.activity-map h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.map-container {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: #f8f9fa;
}

.activity-map-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
}

.map-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 250px;
}

.map-legend h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1.1rem;
}

.map-legend ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.map-legend li {
  padding: 4px 0;
  color: #666;
  font-size: 0.9rem;
  border-bottom: 1px solid #eee;
}

.map-legend li:last-child {
  border-bottom: none;
}

/* 活动不存在样式 */
.activity-not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.not-found-content {
  max-width: 500px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .map-overlay {
    position: static;
    margin-top: 15px;
    max-width: none;
  }
  
  .activity-map-image {
    border-radius: 8px;
  }
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
