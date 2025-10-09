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

        <!-- 任务管理入口 - 仅对有权限的用户显示 -->
        <el-button 
          v-if="registrationInfo.canAccessTaskManagement"
          type="warning" 
          size="large"
          @click="goToTaskManagement"
        >
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
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
  canAccessTaskManagement: false,
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
    
    if (!activityId) {
      ElMessage.error('活动ID不存在')
      router.back()
      return
    }
    
    const response = await getActivityDetail(activityId)
    if (response.code === 200) {
      activity.value = response.data.activity
    }
  } catch (error) {
    console.error('获取活动详情失败:', error)
    ElMessage.error('获取活动详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

// 检查报名状态
const checkRegistrationStatus = async () => {
  try {
    const activityId = route.params.id
    if (!activityId) return
    
    const response = await checkRegistration(activityId)
    if (response.code === 200) {
      registrationInfo.value = {
        isRegistered: response.data.isRegistered,
        canAccessTaskManagement: response.data.registration?.canAccessTaskManagement || false,
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
  
  try {
    await registrationFormRef.value.validate()
    
    registering.value = true
    
    const response = await registerActivityAPI({
      activityId: route.params.id,
      registrationInfo: registrationForm.value
    })
    
    if (response.code === 200) {
      ElMessage.success('报名成功！')
      showRegistrationDialog.value = false
      
      // 重置表单
      registrationFormRef.value.resetFields()
      
      // 刷新报名状态
      await checkRegistrationStatus()
    }
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(error.message || '报名失败，请稍后重试')
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
