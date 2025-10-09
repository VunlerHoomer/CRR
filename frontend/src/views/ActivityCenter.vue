<template>
  <div class="activity-center">
    <div class="page-header">
      <h1>活动中心</h1>
      <p>探索精彩活动，组建团队挑战</p>
    </div>

    <!-- 新活动板块 -->
    <div class="activity-section">
      <h2 class="section-title">新活动</h2>
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="newActivities.length === 0" class="empty-container">
        <el-empty description="暂无新活动" />
      </div>
      <div v-else class="activity-list">
        <div 
          v-for="activity in newActivities" 
          :key="activity._id"
          class="activity-card"
          @click="enterActivity(activity)"
        >
          <div class="activity-banner" :style="{ backgroundImage: `url(${activity.banner})` }">
            <div class="activity-info">
              <h3 class="activity-title">{{ activity.title }}</h3>
              <p class="activity-description">{{ activity.description }}</p>
            </div>
            <div class="activity-actions">
              <el-button 
                v-if="activity.registered" 
                type="success" 
                size="small"
                disabled
              >
                已报名
              </el-button>
              <el-button 
                v-else 
                type="primary" 
                size="small"
              >
                立即报名
              </el-button>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 旧活动板块 -->
    <div class="activity-section">
      <h2 class="section-title">
        旧活动
        <el-icon class="info-icon"><InfoFilled /></el-icon>
      </h2>
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="oldActivities.length === 0" class="empty-container">
        <el-empty description="暂无旧活动" />
      </div>
      <div v-else class="activity-list">
        <div 
          v-for="activity in oldActivities" 
          :key="activity._id"
          class="activity-card"
          @click="enterActivity(activity)"
        >
          <div class="activity-banner" :style="{ backgroundImage: `url(${activity.banner})` }">
            <div class="activity-info">
              <h3 class="activity-title">{{ activity.title }}</h3>
              <p class="activity-description">{{ activity.description }}</p>
            </div>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 组队页面 -->
    <div class="team-section">
      <h2 class="section-title">我的队伍</h2>
      <div class="team-card">
        <div class="team-header">
          <h3 class="team-name">{{ teamInfo?.name || '未加入队伍' }}</h3>
          <div v-if="!teamInfo" class="team-actions">
            <el-button 
              type="primary" 
              @click="router.push('/create-team')"
            >
              创建队伍
            </el-button>
            <el-button 
              type="success" 
              @click="showJoinDialog = true"
            >
              加入队伍
            </el-button>
          </div>
          <div v-else class="team-actions">
            <el-button type="warning" size="small" @click="leaveTeam">退出队伍</el-button>
            <el-button type="info" size="small" @click="openChat">聊天</el-button>
          </div>
        </div>

        <!-- 邀请码部分 -->
        <div v-if="teamInfo" class="invitation-section">
          <h4>邀请码</h4>
          <div class="invitation-code">
            <span class="code-text">{{ invitationCode || '点击生成' }}</span>
            <el-button 
              type="danger" 
              size="small"
              @click="generateInvitationCode"
              :loading="generating"
            >
              {{ invitationCode ? '复制' : '生成邀请码' }}
            </el-button>
          </div>
        </div>

        <!-- 团队成员 -->
        <div v-if="teamInfo" class="team-members">
          <h4>团队成员 ({{ teamMembers.length }}人)</h4>
          <div class="member-list">
            <div 
              v-for="member in teamMembers" 
              :key="member.id"
              class="member-card"
            >
              <el-avatar :size="40" :src="member.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="member-info">
                <div class="member-name">
                  {{ member.name }}
                  <el-tag v-if="member.isCurrentUser" type="success" size="small">您</el-tag>
                  <el-tag v-if="member.isCaptain" type="primary" size="small">队长</el-tag>
                </div>
                <div class="member-id">ID: {{ member.id }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加入队伍对话框 -->
    <el-dialog v-model="showJoinDialog" title="加入队伍" width="400px">
      <el-form @submit.prevent="joinTeam">
        <el-form-item label="邀请码">
          <el-input 
            v-model="joinCode" 
            placeholder="请输入6位邀请码"
            maxlength="6"
            style="text-transform: uppercase;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showJoinDialog = false">取消</el-button>
        <el-button type="primary" @click="joinTeam" :loading="joining">加入队伍</el-button>
      </template>
    </el-dialog>

    <!-- 浮动活动导航按钮 -->
    <div class="floating-nav">
      <el-button type="danger" size="large" @click="openActivityNav">
        <el-icon><ArrowLeft /></el-icon>
        <span>活动<br/>导航</span>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, InfoFilled, User, ArrowLeft, Loading } from '@element-plus/icons-vue'
import { getActivityList } from '@/api/activity'
import { getMyTeam, generateInvitationCode as generateInvitationCodeAPI, joinTeamByCode, leaveTeam as leaveTeamAPI } from '@/api/team'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const newActivities = ref([])
const oldActivities = ref([])
const teamInfo = ref(null)
const teamMembers = ref([])
const loading = ref(false)

const invitationCode = ref('')
const generating = ref(false)
const showJoinDialog = ref(false)
const joinCode = ref('')
const joining = ref(false)

// 方法
const enterActivity = (activity) => {
  ElMessage.info(`进入活动: ${activity.title}`)
  // 这里可以跳转到具体的活动页面
  router.push(`/activity/${activity._id}`)
}

const generateInvitationCode = async () => {
  if (invitationCode.value) {
    // 复制邀请码
    try {
      await navigator.clipboard.writeText(invitationCode.value)
      ElMessage.success('邀请码已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败，请手动复制')
    }
    return
  }

  generating.value = true
  try {
    const response = await generateInvitationCodeAPI()
    invitationCode.value = response.data.invitationCode
    ElMessage.success('邀请码生成成功')
  } catch (error) {
    console.error('生成邀请码失败:', error)
    ElMessage.error('生成邀请码失败')
  } finally {
    generating.value = false
  }
}

const joinTeam = async () => {
  if (!joinCode.value || joinCode.value.length !== 6) {
    ElMessage.warning('请输入6位邀请码')
    return
  }

  joining.value = true
  try {
    await joinTeamByCode(joinCode.value)
    
    ElMessage.success('成功加入队伍')
    showJoinDialog.value = false
    joinCode.value = ''
    
    // 重新加载队伍信息
    await loadTeamInfo()
  } catch (error) {
    console.error('加入队伍失败:', error)
    ElMessage.error(error.response?.data?.message || '加入队伍失败，请检查邀请码')
  } finally {
    joining.value = false
  }
}

const leaveTeam = async () => {
  try {
    await ElMessageBox.confirm('确定要退出队伍吗？', '确认退出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await leaveTeamAPI()
    ElMessage.success('已退出队伍')
    
    // 清空队伍信息
    teamInfo.value = null
    teamMembers.value = []
    invitationCode.value = ''
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出队伍失败:', error)
      ElMessage.error('退出队伍失败')
    }
  }
}

const openChat = () => {
  ElMessage.info('打开聊天功能')
}

const openActivityNav = () => {
  ElMessage.info('打开活动导航')
}

// 数据加载函数
const loadActivities = async () => {
  try {
    loading.value = true
    console.log('🔄 开始加载活动数据...')
    
    // 并行加载新活动和旧活动
    const [newResponse, oldResponse] = await Promise.all([
      getActivityList({ type: 'new', limit: 10 }),
      getActivityList({ type: 'old', limit: 10 })
    ])
    
    console.log('📊 新活动响应:', newResponse)
    console.log('📊 旧活动响应:', oldResponse)
    
    if (newResponse.code === 200) {
      newActivities.value = newResponse.data.activities || []
      console.log(`✅ 加载新活动成功: ${newActivities.value.length} 个`)
    } else {
      console.error('❌ 获取新活动失败:', newResponse.message)
      newActivities.value = []
    }
    
    if (oldResponse.code === 200) {
      oldActivities.value = oldResponse.data.activities || []
      console.log(`✅ 加载旧活动成功: ${oldActivities.value.length} 个`)
    } else {
      console.error('❌ 获取旧活动失败:', oldResponse.message)
      oldActivities.value = []
    }
  } catch (error) {
    console.error('❌ 加载活动数据失败:', error)
    // 设置默认值，避免页面显示异常
    newActivities.value = []
    oldActivities.value = []
    
    // 只在网络错误或严重错误时显示错误消息
    if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500) {
      ElMessage.error('网络连接失败，请稍后重试')
    }
  } finally {
    loading.value = false
    console.log('🏁 活动数据加载完成')
  }
}

const loadTeamInfo = async () => {
  // 只有登录用户才加载队伍信息
  if (!userStore.isLoggedIn) {
    teamInfo.value = null
    teamMembers.value = []
    invitationCode.value = ''
    return
  }
  
  try {
    const response = await getMyTeam()
    const team = response.data.team
    
    if (team) {
      teamInfo.value = {
        name: team.name,
        description: team.description,
        memberCount: team.memberCount,
        maxMembers: team.maxMembers,
        totalPoints: team.totalPoints,
        completedTasks: team.completedTasks
      }
      
      teamMembers.value = team.members || []
      invitationCode.value = team.invitationCode || ''
    } else {
      teamInfo.value = null
      teamMembers.value = []
      invitationCode.value = ''
    }
  } catch (error) {
    console.error('加载队伍信息失败:', error)
    // 不显示错误消息，因为用户可能没有队伍
    teamInfo.value = null
    teamMembers.value = []
    invitationCode.value = ''
  }
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadActivities(),
    loadTeamInfo()
  ])
})
</script>

<style scoped>
.activity-center {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.activity-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  color: #999;
  font-size: 1.2rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.activity-card:hover {
  transform: translateY(-2px);
}

.activity-banner {
  padding: 20px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 100px;
  position: relative;
}

.activity-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
}

.activity-info {
  position: relative;
  z-index: 1;
  flex: 1;
}

.activity-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.activity-description {
  color: #666;
  font-size: 1rem;
}

.activity-actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.arrow-icon {
  font-size: 1.2rem;
  color: #999;
}

.team-section {
  margin-bottom: 40px;
}

.team-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.team-name {
  font-size: 1.8rem;
  color: #333;
  margin: 0;
}

.team-actions {
  display: flex;
  gap: 10px;
}

.team-actions .el-button {
  flex: 1;
  min-width: 100px;
}

.invitation-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.invitation-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1.1rem;
}

.invitation-code {
  display: flex;
  align-items: center;
  gap: 12px;
}

.code-text {
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  color: #409eff;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd;
  min-width: 80px;
  text-align: center;
}

.team-members h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 1.1rem;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.member-info {
  flex: 1;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.member-id {
  font-size: 0.9rem;
  color: #666;
}

.floating-nav {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.floating-nav .el-button {
  height: auto;
  padding: 12px 16px;
  border-radius: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  line-height: 1.2;
}

.floating-nav .el-button span {
  text-align: center;
}

@media (max-width: 768px) {
  .activity-center {
    padding: 15px;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .activity-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .activity-actions {
    align-self: flex-end;
  }
  
  .team-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .floating-nav {
    bottom: 20px;
    right: 20px;
  }
}
</style>