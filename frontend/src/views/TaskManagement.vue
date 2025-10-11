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
              <span>任务管理</span>
            </div>
          </div>
          <div class="nav-right">
            <el-button @click="showProgress = !showProgress" type="primary" size="small">
              <el-icon><DataAnalysis /></el-icon>
              进度统计
            </el-button>
          </div>
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

    <!-- 主要内容区域 -->
    <div v-else class="content-area">
      <!-- 进度统计面板 -->
      <el-card v-if="showProgress" class="progress-card" shadow="never">
        <template #header>
          <div class="progress-header">
            <span>进度统计</span>
            <el-button @click="showProgress = false" text>
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </template>
        
        <div v-if="userStats" class="stats-content">
          <div class="stats-overview">
            <div class="stat-item">
              <div class="stat-value">{{ userStats.totalTasks }}</div>
              <div class="stat-label">总任务数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStats.correctTasks }}</div>
              <div class="stat-label">已完成</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStats.accuracy }}%</div>
              <div class="stat-label">正确率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStats.totalPoints }}</div>
              <div class="stat-label">总得分</div>
            </div>
          </div>
          
          <div class="area-progress">
            <h4>区域进度</h4>
            <div v-for="area in areaProgress" :key="area._id" class="area-progress-item">
              <div class="area-info">
                <span class="area-icon">{{ area.icon || '📍' }}</span>
                <span class="area-name">{{ area.name }}</span>
                <el-tag 
                  :type="area.progress.isCompleted ? 'success' : 'info'" 
                  size="small"
                >
                  {{ area.progress.completedCount }}/{{ area.progress.totalTasks }}
                </el-tag>
              </div>
              <el-progress 
                :percentage="area.progress.completedCount > 0 ? Math.round((area.progress.completedCount / area.progress.totalTasks) * 100) : 0"
                :color="area.color || '#409eff'"
              />
            </div>
          </div>
        </div>
      </el-card>

      <!-- 区域列表 -->
      <div v-if="!currentArea" class="areas-section">
        <h2 class="section-title">选择区域开始任务</h2>
        <div class="areas-grid">
          <div 
            v-for="area in areas" 
            :key="area._id"
            class="area-card"
            :class="{ 'locked': !area.isUnlocked }"
            @click="handleAreaClick(area)"
          >
            <div class="area-header">
              <span class="area-icon">{{ area.icon || '📍' }}</span>
              <span class="area-name">{{ area.name }}</span>
            </div>
            <div class="area-description">{{ area.description || '暂无描述' }}</div>
            <div class="area-progress-info">
              <el-progress 
                :percentage="area.progress.percentage"
                :color="area.color || '#409eff'"
                :stroke-width="6"
              />
              <div class="progress-text">
                {{ area.progress.completed }}/{{ area.progress.total }} 已完成
              </div>
            </div>
            <div class="area-status">
              <el-tag 
                v-if="!area.isUnlocked" 
                type="danger" 
                size="small"
              >
                已锁定
              </el-tag>
              <el-tag 
                v-else-if="area.progress.isCompleted" 
                type="success" 
                size="small"
              >
                已完成
              </el-tag>
              <el-tag 
                v-else-if="area.progress.completed > 0" 
                type="warning" 
                size="small"
              >
                进行中
              </el-tag>
              <el-tag 
                v-else 
                type="info" 
                size="small"
              >
                未开始
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务列表 -->
      <div v-else class="tasks-section">
        <div class="tasks-header">
          <el-button @click="currentArea = null" class="back-to-areas">
            <el-icon><ArrowLeft /></el-icon>
            返回区域列表
          </el-button>
          <div class="current-area-info">
            <span class="area-icon">{{ currentArea.icon || '📍' }}</span>
            <span class="area-name">{{ currentArea.name }}</span>
          </div>
        </div>

        <div class="tasks-grid">
          <div 
            v-for="task in tasks" 
            :key="task._id"
            class="task-card"
            :class="{ 
              'completed': task.userRecord?.isCorrect,
              'locked': !canAccessTask(task),
              'current': isCurrentTask(task)
            }"
            @click="selectTask(task)"
          >
            <div class="task-header">
              <div class="task-order">{{ task.order }}</div>
              <div class="task-title">{{ task.title }}</div>
              <div class="task-points">{{ task.points }}分</div>
            </div>
            
            <div class="task-description">{{ task.description || task.question }}</div>
            
            <div class="task-footer">
              <el-tag 
                :type="getDifficultyType(task.difficulty)" 
                size="small"
              >
                {{ getDifficultyText(task.difficulty) }}
              </el-tag>
              
              <div class="task-status">
                <el-icon v-if="task.userRecord?.isCorrect" color="#67c23a">
                  <CircleCheck />
                </el-icon>
                <el-icon v-else-if="!canAccessTask(task)" color="#c0c4cc">
                  <Lock />
                </el-icon>
                <el-icon v-else color="#409eff">
                  <Right />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务答题对话框 -->
    <el-dialog
      v-model="taskDialogVisible"
      :title="currentTask ? `任务 ${currentTask.order}: ${currentTask.title}` : '任务详情'"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="currentTask" class="task-detail">
        <div class="task-info">
          <div class="task-meta">
            <el-tag :type="getDifficultyType(currentTask.difficulty)">
              {{ getDifficultyText(currentTask.difficulty) }}
            </el-tag>
            <el-tag type="warning">{{ currentTask.points }}分</el-tag>
          </div>
          
          <div class="task-question">
            <h4>问题：</h4>
            <p>{{ currentTask.question }}</p>
          </div>
          
          <div v-if="currentTask.description" class="task-description">
            <h4>描述：</h4>
            <p>{{ currentTask.description }}</p>
          </div>

          <!-- 选择题选项 -->
          <div v-if="currentTask.questionType === 'choice' || currentTask.questionType === 'multiple'" class="task-options">
            <h4>选项：</h4>
            <el-radio-group 
              v-if="currentTask.questionType === 'choice'" 
              v-model="userAnswer"
              class="options-group"
            >
              <el-radio 
                v-for="option in currentTask.options" 
                :key="option.value"
                :label="option.value"
                class="option-item"
              >
                {{ option.label }}
              </el-radio>
            </el-radio-group>
            
            <el-checkbox-group 
              v-if="currentTask.questionType === 'multiple'" 
              v-model="userAnswerArray"
              class="options-group"
            >
              <el-checkbox 
                v-for="option in currentTask.options" 
                :key="option.value"
                :label="option.value"
                class="option-item"
              >
                {{ option.label }}
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- 文本输入 -->
          <div v-else class="task-input">
            <h4>答案：</h4>
            <el-input
              v-model="userAnswer"
              :type="currentTask.questionType === 'number' ? 'number' : 'text'"
              :placeholder="getInputPlaceholder(currentTask.questionType)"
              @keyup.enter="submitAnswer"
            />
          </div>

          <div v-if="currentTask.hint" class="task-hint">
            <el-alert :title="currentTask.hint" type="info" show-icon />
          </div>

          <!-- 答题记录 -->
          <div v-if="currentTask.userRecord && !currentTask.userRecord.isCorrect" class="task-attempts">
            <el-alert 
              title="之前的答题记录" 
              type="warning" 
              show-icon
            >
              <p>尝试次数: {{ currentTask.userRecord.attemptCount }}</p>
              <p>上次答案: {{ currentTask.userRecord.userAnswer }}</p>
            </el-alert>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitAnswer"
          :loading="submitting"
          :disabled="!canSubmit"
        >
          提交答案
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, Box, Loading, Warning, DataAnalysis, Close, 
  CircleCheck, Lock, Right 
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { checkRegistration } from '@/api/registration'
import { 
  getActivityAreas, 
  getAreaTasks, 
  getTaskDetail, 
  submitTaskAnswer,
  getUserProgress 
} from '@/api/task'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 权限控制
const hasPermission = ref(false)
const permissionLoading = ref(true)
const permissionError = ref('')

// 数据状态
const areas = ref([])
const currentArea = ref(null)
const tasks = ref([])
const currentTask = ref(null)
const userStats = ref(null)
const areaProgress = ref([])

// UI状态
const showProgress = ref(false)
const taskDialogVisible = ref(false)
const submitting = ref(false)
const userAnswer = ref('')
const userAnswerArray = ref([])

// 活动ID
const activityId = computed(() => route.params.id)

// 计算属性
const canSubmit = computed(() => {
  if (!currentTask.value) return false
  
  if (currentTask.value.questionType === 'multiple') {
    return userAnswerArray.value.length > 0
  } else {
    return userAnswer.value.trim() !== ''
  }
})

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
      if (registration.status === 'approved') {
        hasPermission.value = true
        permissionError.value = ''
      } else if (registration.status === 'pending') {
        permissionError.value = '您的报名正在审核中，请等待管理员审核通过'
        hasPermission.value = false
      } else if (registration.status === 'rejected') {
        permissionError.value = '您的报名已被拒绝，无法访问任务管理'
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

// 获取区域列表
const fetchAreas = async () => {
  try {
    // 确保activityId有效
    if (!activityId.value || activityId.value === 'undefined' || activityId.value === 'null') {
      throw new Error('活动ID无效')
    }
    
    console.log('🔄 获取区域列表，活动ID:', activityId.value)
    const response = await getActivityAreas(activityId.value, userStore.user?.id)
    if (response.code === 200) {
      areas.value = response.data.areas
      console.log('✅ 区域列表获取成功:', areas.value.length)
    }
  } catch (error) {
    console.error('❌ 获取区域列表失败:', error)
    ElMessage.error('获取区域列表失败: ' + error.message)
  }
}

// 获取用户进度
const fetchUserProgress = async () => {
  try {
    // 确保activityId有效
    if (!activityId.value || activityId.value === 'undefined' || activityId.value === 'null') {
      throw new Error('活动ID无效')
    }
    
    console.log('🔄 获取用户进度，活动ID:', activityId.value)
    const response = await getUserProgress(activityId.value, userStore.user?.id)
    if (response.code === 200) {
      userStats.value = response.data.stats
      areaProgress.value = response.data.areaProgress
      console.log('✅ 用户进度获取成功:', userStats.value)
    }
  } catch (error) {
    console.error('❌ 获取用户进度失败:', error)
  }
}

// 选择区域
// 处理区域点击
const handleAreaClick = (area) => {
  if (!area.isUnlocked) {
    ElMessage.warning('该区域尚未解锁，请先完成前置区域的所有任务')
    return
  }
  selectArea(area)
}

const selectArea = async (area) => {
  currentArea.value = area
  await fetchAreaTasks(area._id)
}

// 获取区域任务
const fetchAreaTasks = async (areaId) => {
  try {
    const response = await getAreaTasks(areaId, userStore.user?.id)
    if (response.code === 200) {
      tasks.value = response.data.tasks
    }
  } catch (error) {
    console.error('获取区域任务失败:', error)
    ElMessage.error('获取区域任务失败')
  }
}

// 选择任务
const selectTask = async (task) => {
  if (!canAccessTask(task)) {
    ElMessage.warning('请先完成前置任务')
    return
  }

  if (task.userRecord?.isCorrect) {
    ElMessage.info('该任务已完成')
    return
  }

  currentTask.value = task
  userAnswer.value = ''
  userAnswerArray.value = []
  taskDialogVisible.value = true
}

// 检查是否可以访问任务
const canAccessTask = (task) => {
  if (task.userRecord?.isCorrect) return true
  
  // 找到当前任务的索引
  const taskIndex = tasks.value.findIndex(t => t._id === task._id)
  if (taskIndex === 0) return true // 第一个任务总是可以访问
  
  // 检查前一个任务是否已完成
  if (taskIndex > 0) {
    const prevTask = tasks.value[taskIndex - 1]
    return prevTask.userRecord?.isCorrect || false
  }
  
  return false
}

// 判断是否是当前任务
const isCurrentTask = (task) => {
  if (task.userRecord?.isCorrect) return false
  
  const taskIndex = tasks.value.findIndex(t => t._id === task._id)
  if (taskIndex === 0) return true
  
  if (taskIndex > 0) {
    const prevTask = tasks.value[taskIndex - 1]
    return prevTask.userRecord?.isCorrect || false
  }
  
  return false
}

// 提交答案
const submitAnswer = async () => {
  if (!canSubmit.value) {
    ElMessage.warning('请先输入答案')
    return
  }

  try {
    submitting.value = true
    
    let answer = userAnswer.value
    if (currentTask.value.questionType === 'multiple') {
      answer = userAnswerArray.value
    }
    
    const response = await submitTaskAnswer(currentTask.value._id, answer, userStore.user?.id)
    
    if (response.code === 200) {
      if (response.data.isCorrect) {
        ElMessage.success('答案正确！')
        
        // 更新任务状态
        const taskIndex = tasks.value.findIndex(t => t._id === currentTask.value._id)
        if (taskIndex !== -1) {
          tasks.value[taskIndex].userRecord = {
            isCorrect: true,
            userAnswer: answer,
            attemptCount: response.data.attemptCount,
            submittedAt: new Date(),
            completedAt: new Date(),
            pointsEarned: response.data.pointsEarned
          }
        }
        
        // 如果有下一个任务，自动打开
        if (response.data.nextTask) {
          const nextTask = tasks.value.find(t => t._id === response.data.nextTask._id)
          if (nextTask) {
            taskDialogVisible.value = false
            setTimeout(() => {
              selectTask(nextTask)
            }, 1000)
          }
        } else if (response.data.isAreaCompleted) {
          ElMessage.success('恭喜！您已完成该区域的所有任务！')
        }
        
        taskDialogVisible.value = false
        
        // 刷新进度
        await fetchUserProgress()
        
      } else {
        ElMessage.error('答案错误，请重试')
        
        // 更新尝试次数
        const taskIndex = tasks.value.findIndex(t => t._id === currentTask.value._id)
        if (taskIndex !== -1 && tasks.value[taskIndex].userRecord) {
          tasks.value[taskIndex].userRecord.attemptCount = response.data.attemptCount
        }
      }
    }
  } catch (error) {
    console.error('提交答案失败:', error)
    ElMessage.error(error.response?.data?.message || '提交答案失败')
  } finally {
    submitting.value = false
  }
}

// 获取输入框占位符
const getInputPlaceholder = (type) => {
  const placeholders = {
    text: '请输入文本答案',
    number: '请输入数字答案'
  }
  return placeholders[type] || '请输入答案'
}

// 获取难度文本
const getDifficultyText = (difficulty) => {
  const difficulties = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return difficulties[difficulty] || difficulty
}

// 获取难度类型
const getDifficultyType = (difficulty) => {
  const types = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return types[difficulty] || 'info'
}

onMounted(async () => {
  try {
    console.log('📋 开始加载任务管理页面...')
    console.log('🔍 路由参数:', route.params)
    console.log('🔍 活动ID:', activityId.value, '类型:', typeof activityId.value)
    
    // 检查任务管理权限
    await checkTaskPermission()
    
    if (hasPermission.value) {
      // 获取区域列表和用户进度
      await Promise.all([
        fetchAreas(),
        fetchUserProgress()
      ])
    }
    
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
  gap: 8px;
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
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 进度统计卡片 */
.progress-card {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.area-progress-item {
  margin-bottom: 16px;
}

.area-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.area-icon {
  font-size: 16px;
}

.area-name {
  font-weight: 500;
}

/* 区域列表 */
.section-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

.areas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.area-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.area-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.area-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
}

.area-card.locked:hover {
  transform: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.area-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.area-icon {
  font-size: 20px;
}

.area-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.area-description {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.area-progress-info {
  margin-bottom: 16px;
}

.progress-text {
  text-align: center;
  color: #666;
  font-size: 12px;
  margin-top: 8px;
}

.area-status {
  text-align: center;
}

/* 任务列表 */
.tasks-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.back-to-areas {
  flex-shrink: 0;
}

.current-area-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.task-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.task-card:hover:not(.locked) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.task-card.completed {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e8 100%);
}

.task-card.current {
  border-color: #409eff;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
}

.task-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.task-order {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.task-card.completed .task-order {
  background: #67c23a;
}

.task-card.locked .task-order {
  background: #c0c4cc;
}

.task-title {
  flex: 1;
  margin: 0 12px;
  font-weight: bold;
  color: #333;
}

.task-points {
  background: #ff9800;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.task-description {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-status {
  font-size: 18px;
}

/* 任务详情对话框 */
.task-detail {
  padding: 20px 0;
}

.task-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.task-question, .task-description, .task-input, .task-options {
  margin-bottom: 20px;
}

.task-question h4, .task-description h4, .task-input h4, .task-options h4 {
  margin-bottom: 8px;
  color: #333;
}

.task-question p, .task-description p {
  color: #666;
  line-height: 1.6;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  width: 100%;
}

.task-hint {
  margin-bottom: 20px;
}

.task-attempts {
  margin-bottom: 20px;
}

.task-attempts p {
  margin: 4px 0;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-area {
    padding: 10px;
  }
  
  .areas-grid {
    grid-template-columns: 1fr;
  }
  
  .tasks-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tasks-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>
