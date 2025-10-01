<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="profile-header">
        <div class="user-info">
          <el-avatar :size="80" :src="user?.avatar">
            {{ user?.nickname?.charAt(0) }}
          </el-avatar>
          <div class="user-details">
            <h2>{{ user?.nickname || '用户' }}</h2>
            <p>{{ user?.phone || '未绑定手机号' }}</p>
            <p v-if="user?.school">学校：{{ user.school }}</p>
            <p v-if="user?.gender">性别：{{ genderText(user.gender) }}</p>
            <div class="user-stats">
              <el-tag type="success">等级 {{ user?.level || 1 }}</el-tag>
              <el-tag type="warning">{{ user?.points || 0 }} 积分</el-tag>
            </div>
          </div>
        </div>
        <el-button type="primary" @click="editProfile = true">编辑资料</el-button>
      </div>

      <div class="profile-content">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-card class="stats-card">
              <template #header>
                <span>答题统计</span>
              </template>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ user?.totalQuizCount || 0 }}</div>
                  <div class="stat-label">总答题数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ user?.correctQuizCount || 0 }}</div>
                  <div class="stat-label">正确题数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ user?.accuracy || 0 }}%</div>
                  <div class="stat-label">准确率</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ user?.totalLotteryCount || 0 }}</div>
                  <div class="stat-label">抽签次数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12">
            <el-card class="achievements-card">
              <template #header>
                <span>成就徽章</span>
              </template>
              <div class="achievements-grid">
                <div 
                  v-for="achievement in achievements" 
                  :key="achievement.id"
                  class="achievement-item"
                  :class="{ unlocked: achievement.unlocked }"
                >
                  <el-icon :size="32">
                    <component :is="achievement.icon" />
                  </el-icon>
                  <span>{{ achievement.name }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :xs="24" :sm="12">
            <el-card class="quiz-history-card">
              <template #header>
                <span>最近答题记录</span>
              </template>
              <div class="history-list">
                <div 
                  v-for="record in quizHistory" 
                  :key="record.id"
                  class="history-item"
                >
                  <div class="history-info">
                    <span class="history-title">{{ record.title }}</span>
                    <span class="history-time">{{ record.time }}</span>
                  </div>
                  <div class="history-result">
                    <el-tag :type="record.isCorrect ? 'success' : 'danger'">
                      {{ record.isCorrect ? '正确' : '错误' }}
                    </el-tag>
                    <span class="history-points">+{{ record.points }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12">
            <el-card class="points-history-card">
              <template #header>
                <span>积分记录</span>
              </template>
              <div class="history-list">
                <div 
                  v-for="record in pointsHistory" 
                  :key="record.id"
                  class="history-item"
                >
                  <div class="history-info">
                    <span class="history-title">{{ record.title }}</span>
                    <span class="history-time">{{ record.time }}</span>
                  </div>
                  <div class="history-points" :class="{ positive: record.points > 0 }">
                    {{ record.points > 0 ? '+' : '' }}{{ record.points }}
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editProfile" title="编辑资料" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="学校">
          <el-input v-model="editForm.school" placeholder="请输入就读学校" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editForm.gender" placeholder="请选择性别" style="width:100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :http-request="uploadAvatar"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editProfile = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { Trophy, Star, TrophyBase, Aim, Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()

const editProfile = ref(false)
const editForm = reactive({
  nickname: '',
  avatar: '',
  phone: '',
  school: '',
  gender: ''
})

const user = computed(() => userStore.user)

const achievements = ref([
  {
    id: 1,
    name: '新手入门',
    icon: 'Star',
    unlocked: true
  },
  {
    id: 2,
    name: '答题达人',
    icon: 'Trophy',
    unlocked: (user.value?.totalQuizCount || 0) >= 10
  },
  {
    id: 3,
    name: '准确率高手',
    icon: 'Target',
    unlocked: (user.value?.accuracy || 0) >= 80
  },
  {
    id: 4,
    name: '积分富翁',
    icon: 'Fire',
    unlocked: (user.value?.points || 0) >= 1000
  }
])

const quizHistory = ref([
  {
    id: 1,
    title: 'JavaScript 基础测试',
    time: '2023-12-01 10:30',
    isCorrect: true,
    points: 20
  },
  {
    id: 2,
    title: 'Vue.js 进阶测试',
    time: '2023-12-01 09:15',
    isCorrect: false,
    points: 0
  },
  {
    id: 3,
    title: 'CSS 样式测试',
    time: '2023-11-30 16:45',
    isCorrect: true,
    points: 15
  }
])

const pointsHistory = ref([
  {
    id: 1,
    title: '答题奖励',
    time: '2023-12-01 10:30',
    points: 20
  },
  {
    id: 2,
    title: '抽签奖励',
    time: '2023-12-01 09:15',
    points: 10
  },
  {
    id: 3,
    title: '每日签到',
    time: '2023-11-30 16:45',
    points: 5
  }
])

const uploadAvatar = async (options) => {
  const { file, onSuccess, onError } = options
  try {
    const form = new FormData()
    form.append('file', file)
    const { default: request } = await import('@/api/request')
    const resp = await request.post('/user/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (resp.code === 200) {
      editForm.avatar = resp.data.url
      userStore.updateUser(resp.data.user)
      ElMessage.success('头像上传成功')
      onSuccess && onSuccess(resp)
    } else {
      throw new Error(resp.message || '上传失败')
    }
  } catch (err) {
    ElMessage.error(err.message || '上传失败')
    onError && onError(err)
  }
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

const saveProfile = async () => {
  try {
    const res = await (await import('@/api/user')).updateUserInfo(editForm)
    if (res.code === 200) {
      userStore.updateUser(res.data.user)
    }
    ElMessage.success('资料更新成功')
    editProfile.value = false
  } catch (error) {
    ElMessage.error('更新失败，请重试')
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchUserInfo()
    editForm.nickname = user.value?.nickname || ''
    editForm.avatar = user.value?.avatar || ''
    editForm.phone = user.value?.phone || ''
    editForm.school = user.value?.school || ''
    editForm.gender = user.value?.gender || ''
  }
})

const genderText = (g) => {
  if (g === 'male') return '男'
  if (g === 'female') return '女'
  if (g === 'other') return '其他'
  return ''
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-details h2 {
  margin: 0 0 8px;
  color: #303133;
  font-size: 24px;
}

.user-details p {
  margin: 0 0 12px;
  color: #606266;
}

.user-stats {
  display: flex;
  gap: 12px;
}

.profile-content {
  margin-bottom: 20px;
}

.stats-card,
.achievements-card,
.quiz-history-card,
.points-history-card {
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
  opacity: 0.5;
}

.achievement-item.unlocked {
  border-color: #67c23a;
  background-color: #f0f9ff;
  opacity: 1;
}

.achievement-item span {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-title {
  font-size: 14px;
  color: #303133;
}

.history-time {
  font-size: 12px;
  color: #909399;
}

.history-result {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-points {
  font-weight: bold;
  color: #67c23a;
}

.history-points.positive {
  color: #67c23a;
}

.avatar-uploader {
  text-align: center;
}

.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .user-info {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-grid,
  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style>
