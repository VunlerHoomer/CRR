<template>
  <div class="create-team">
    <div class="page-header">
      <el-button @click="goBack" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>创建队伍</h1>
      <p>组建您的专属团队，开始精彩活动</p>
    </div>

    <div class="create-form-container">
      <el-card class="create-card">
        <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="createRules"
          label-width="100px"
          class="create-form"
        >
          <el-form-item label="队伍名称" prop="name">
            <el-input
              v-model="createForm.name"
              placeholder="请输入队伍名称"
              maxlength="20"
              show-word-limit
              size="large"
            />
          </el-form-item>


          <el-form-item label="活动选择" prop="activityId">
            <el-select
              v-model="createForm.activityId"
              placeholder="请选择要参与的活动"
              size="large"
              style="width: 100%"
              @change="onActivityChange"
            >
              <el-option
                v-for="activity in availableActivities"
                :key="activity._id"
                :label="activity.title"
                :value="activity._id"
                :disabled="!activity.canRegister"
              >
                <div class="activity-option">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-meta">
                    <span class="activity-time">{{ formatDate(activity.startTime) }}</span>
                    <span class="activity-location">{{ activity.location }}</span>
                    <el-tag v-if="!activity.canRegister" type="danger" size="small">已停止报名</el-tag>
                  </div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item>
            <div class="form-actions">
              <el-button @click="goBack" size="large">取消</el-button>
              <el-button 
                type="primary" 
                @click="createTeam" 
                :loading="creating"
                size="large"
              >
                创建队伍
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 邀请码生成区域 -->
      <el-card v-if="generatedInvitationCode" class="invitation-card">
        <template #header>
          <div class="card-header">
            <span>邀请码生成成功</span>
            <el-icon class="success-icon"><CircleCheck /></el-icon>
          </div>
        </template>
        
        <div class="invitation-content">
          <div class="invitation-info">
            <p>您的队伍已创建成功！请保存好邀请码，分享给其他队员。</p>
          </div>
          
          <div class="invitation-code-section">
            <h4>邀请码</h4>
            <div class="code-display">
              <span class="code-text">{{ generatedInvitationCode }}</span>
              <el-button 
                type="primary" 
                @click="copyInvitationCode"
                :loading="copying"
                size="large"
              >
                <el-icon><DocumentCopy /></el-icon>
                {{ copied ? '已复制' : '复制邀请码' }}
              </el-button>
            </div>
          </div>

          <div class="next-steps">
            <h4>下一步</h4>
            <ol>
              <li>将邀请码分享给想要加入的队员</li>
              <li>队员在活动中心输入邀请码加入队伍</li>
              <li>等待活动开始，享受团队协作的乐趣</li>
            </ol>
          </div>

          <div class="action-buttons">
            <el-button @click="goToActivityCenter" size="large">
              返回活动中心
            </el-button>
            <el-button type="success" @click="viewMyTeam" size="large">
              查看我的队伍
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, CircleCheck, DocumentCopy } from '@element-plus/icons-vue'
import { getActivityList } from '@/api/activity'
import { createTeam as createTeamAPI, generateInvitationCode } from '@/api/team'

const router = useRouter()

// 响应式数据
const createFormRef = ref(null)
const creating = ref(false)
const copying = ref(false)
const copied = ref(false)
const availableActivities = ref([])
const generatedInvitationCode = ref('')

const createForm = ref({
  name: '',
  activityId: ''
})

const createRules = {
  name: [
    { required: true, message: '请输入队伍名称', trigger: 'blur' },
    { min: 2, max: 20, message: '队伍名称长度应在2-20个字符之间', trigger: 'blur' }
  ],
  activityId: [
    { required: true, message: '请选择要参与的活动', trigger: 'change' }
  ]
}

// 方法
const goBack = () => {
  router.back()
}

const goToActivityCenter = () => {
  router.push('/activity-center')
}

const viewMyTeam = () => {
  router.push('/activity-center')
}

const loadAvailableActivities = async () => {
  try {
    const response = await getActivityList({ type: 'new', limit: 20 })
    availableActivities.value = response.data.activities || []
  } catch (error) {
    console.error('加载活动列表失败:', error)
    ElMessage.error('加载活动列表失败')
  }
}

const onActivityChange = (activityId) => {
  const activity = availableActivities.value.find(a => a._id === activityId)
  if (activity && !activity.canRegister) {
    ElMessage.warning('该活动已停止报名')
    createForm.value.activityId = ''
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const createTeam = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    creating.value = true

    // 创建队伍
    const teamData = {
      name: createForm.value.name,
      activity: createForm.value.activityId
    }

    const response = await createTeamAPI(teamData)
    
    if (response.data.code === 200) {
      ElMessage.success('队伍创建成功！')
      
      // 从响应中获取邀请码
      if (response.data.data.invitationCode) {
        generatedInvitationCode.value = response.data.data.invitationCode
      }
    }
  } catch (error) {
    console.error('创建队伍失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('创建队伍失败，请稍后重试')
    }
  } finally {
    creating.value = false
  }
}

const copyInvitationCode = async () => {
  if (!generatedInvitationCode.value) return
  
  copying.value = true
  try {
    await navigator.clipboard.writeText(generatedInvitationCode.value)
    copied.value = true
    ElMessage.success('邀请码已复制到剪贴板')
    
    // 3秒后恢复按钮状态
    setTimeout(() => {
      copied.value = false
    }, 3000)
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  } finally {
    copying.value = false
  }
}

// 生命周期
onMounted(() => {
  loadAvailableActivities()
})
</script>

<style scoped>
.create-team {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
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

.page-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.page-header p {
  color: #666;
  margin: 0;
}

.create-form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.create-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.create-form {
  padding: 20px 0;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 20px;
}

.activity-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-title {
  font-weight: 500;
  color: #333;
}

.activity-meta {
  display: flex;
  gap: 12px;
  font-size: 0.9rem;
  color: #666;
}

.invitation-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #67c23a;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #67c23a;
}

.success-icon {
  color: #67c23a;
  font-size: 1.2rem;
}

.invitation-content {
  padding: 10px 0;
}

.invitation-info {
  margin-bottom: 24px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #67c23a;
}

.invitation-info p {
  margin: 0;
  color: #333;
  line-height: 1.6;
}

.invitation-code-section {
  margin-bottom: 24px;
}

.invitation-code-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 1.1rem;
}

.code-display {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.code-text {
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: bold;
  color: #409eff;
  padding: 8px 16px;
  background: white;
  border-radius: 6px;
  border: 2px solid #409eff;
  min-width: 120px;
  text-align: center;
  letter-spacing: 2px;
}

.next-steps {
  margin-bottom: 24px;
}

.next-steps h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1.1rem;
}

.next-steps ol {
  margin: 0;
  padding-left: 20px;
  color: #666;
  line-height: 1.6;
}

.next-steps li {
  margin-bottom: 8px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 768px) {
  .create-team {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .code-display {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
