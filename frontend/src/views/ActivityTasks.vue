<template>
  <div class="activity-tasks">
    <div class="page-header">
      <el-button @click="goBack" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回活动详情
      </el-button>
      <h1>{{ activity?.title }} - 任务管理</h1>
    </div>

    <div v-loading="loading">
      <div v-if="activity">
        <!-- 活动信息 -->
        <el-card class="activity-info-card" style="margin-bottom: 20px">
          <template #header>
            <h3>活动信息</h3>
          </template>
          <div class="activity-summary">
            <p><strong>活动描述：</strong>{{ activity.description }}</p>
            <p><strong>活动时间：</strong>{{ formatDateTime(activity.startTime) }} - {{ formatDateTime(activity.endTime) }}</p>
            <p><strong>活动地点：</strong>{{ activity.location }}</p>
          </div>
        </el-card>

        <!-- 任务进度概览 -->
        <el-card class="progress-card" style="margin-bottom: 20px">
          <template #header>
            <h3>任务进度概览</h3>
          </template>
          <div class="progress-overview">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="progress-item">
                  <div class="progress-number">{{ progress.totalTasks }}</div>
                  <div class="progress-label">总任务数</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="progress-item">
                  <div class="progress-number">{{ progress.completedTasks }}</div>
                  <div class="progress-label">已完成</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="progress-item">
                  <div class="progress-number">{{ progress.totalScore }}</div>
                  <div class="progress-label">总积分</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="progress-item">
                  <div class="progress-number">{{ progress.completionRate }}%</div>
                  <div class="progress-label">完成率</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 任务列表 -->
        <el-card>
          <template #header>
            <h3>任务列表</h3>
          </template>
          <div v-if="tasks.length === 0" class="empty-tasks">
            <el-empty description="暂无任务" />
          </div>
          <div v-else class="tasks-list">
            <div 
              v-for="task in tasks" 
              :key="task._id"
              class="task-item"
              :class="{ 'task-completed': task.userProgress.status === 'completed' }"
            >
              <div class="task-header">
                <div class="task-info">
                  <h4 class="task-name">{{ task.name }}</h4>
                  <div class="task-meta">
                    <el-tag :type="getTypeTagType(task.type)" size="small">
                      {{ getTypeText(task.type) }}
                    </el-tag>
                    <el-tag :type="getDifficultyTagType(task.difficulty)" size="small">
                      {{ getDifficultyText(task.difficulty) }}
                    </el-tag>
                    <span class="task-points">{{ task.points }} 积分</span>
                  </div>
                </div>
                <div class="task-status">
                  <el-tag :type="getProgressTagType(task.userProgress.status)">
                    {{ getProgressText(task.userProgress.status) }}
                  </el-tag>
                </div>
              </div>
              
              <div class="task-description">
                <p>{{ task.description }}</p>
                <p class="task-area"><strong>区域：</strong>{{ task.area }}</p>
              </div>

              <div class="task-progress">
                <div class="progress-info">
                  <span>尝试次数: {{ task.userProgress.attempts }}/{{ task.maxAttempts }}</span>
                  <span v-if="task.userProgress.score > 0">得分: {{ task.userProgress.score }}</span>
                </div>
                <el-progress 
                  :percentage="getTaskProgress(task)" 
                  :color="getProgressColor(task)"
                  :show-text="false"
                />
              </div>

              <div class="task-actions">
                <el-button 
                  v-if="task.userProgress.status === 'not_started'"
                  type="primary" 
                  @click="startTask(task)"
                >
                  开始任务
                </el-button>
                <el-button 
                  v-else-if="task.userProgress.canRetry"
                  type="warning" 
                  @click="startTask(task)"
                >
                  继续任务
                </el-button>
                <el-button 
                  v-else-if="task.userProgress.status === 'completed'"
                  type="success" 
                  disabled
                >
                  已完成
                </el-button>
                <el-button 
                  v-else
                  type="danger" 
                  disabled
                >
                  无法继续
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getActivityDetail } from '@/api/activity'
import { getActivityTasks, getTaskProgress as getTaskProgressAPI } from '@/api/task'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const activity = ref(null)
const tasks = ref([])
const progress = ref({
  totalTasks: 0,
  completedTasks: 0,
  totalScore: 0,
  completionRate: 0
})

const goBack = () => {
  router.back()
}

// 获取活动详情
const fetchActivityDetail = async () => {
  try {
    const activityId = route.params.id
    const response = await getActivityDetail(activityId)
    if (response.code === 200) {
      activity.value = response.data.activity
    }
  } catch (error) {
    console.error('获取活动详情失败:', error)
    ElMessage.error('获取活动详情失败')
  }
}

// 获取任务列表
const fetchTasks = async () => {
  try {
    const activityId = route.params.id
    const response = await getActivityTasks(activityId)
    if (response.code === 200) {
      tasks.value = response.data.tasks
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  }
}

// 获取任务进度
const fetchProgress = async () => {
  try {
    const activityId = route.params.id
    const response = await getTaskProgressAPI(activityId)
    if (response.code === 200) {
      progress.value = response.data.progress
    }
  } catch (error) {
    console.error('获取任务进度失败:', error)
  }
}

// 开始任务
const startTask = async (task) => {
  try {
    // 这里可以跳转到具体的任务执行页面
    ElMessage.info(`开始任务: ${task.name}`)
    // router.push(`/task/${task._id}/execute`)
  } catch (error) {
    console.error('开始任务失败:', error)
    ElMessage.error('开始任务失败')
  }
}

// 工具函数
const getTypeText = (type) => {
  const types = {
    quiz: '答题',
    location: '位置签到',
    photo: '拍照',
    text: '文本',
    custom: '自定义'
  }
  return types[type] || type
}

const getTypeTagType = (type) => {
  const types = {
    quiz: 'primary',
    location: 'success',
    photo: 'warning',
    text: 'info',
    custom: 'danger'
  }
  return types[type] || 'info'
}

const getDifficultyText = (difficulty) => {
  const difficulties = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return difficulties[difficulty] || difficulty
}

const getDifficultyTagType = (difficulty) => {
  const types = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return types[difficulty] || 'info'
}

const getProgressText = (status) => {
  const statuses = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    failed: '失败'
  }
  return statuses[status] || '未知'
}

const getProgressTagType = (status) => {
  const types = {
    not_started: 'info',
    in_progress: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return types[status] || 'info'
}

const getTaskProgress = (task) => {
  if (task.userProgress.status === 'completed') return 100
  if (task.userProgress.status === 'not_started') return 0
  return (task.userProgress.attempts / task.maxAttempts) * 100
}

const getProgressColor = (task) => {
  if (task.userProgress.status === 'completed') return '#67c23a'
  if (task.userProgress.status === 'failed') return '#f56c6c'
  return '#409eff'
}

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
  loading.value = true
  try {
    await Promise.all([
      fetchActivityDetail(),
      fetchTasks(),
      fetchProgress()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.activity-tasks {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  color: #333;
}

.back-button {
  flex-shrink: 0;
}

.activity-summary p {
  margin: 8px 0;
  color: #666;
}

.progress-overview {
  padding: 20px 0;
}

.progress-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.progress-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.progress-label {
  color: #666;
  font-size: 14px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-item {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.task-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.task-item.task-completed {
  border-color: #67c23a;
  background: #f0f9ff;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.task-info {
  flex: 1;
}

.task-name {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-points {
  color: #409eff;
  font-weight: 500;
}

.task-description {
  margin-bottom: 15px;
}

.task-description p {
  margin: 5px 0;
  color: #666;
  line-height: 1.6;
}

.task-area {
  font-size: 14px;
}

.task-progress {
  margin-bottom: 15px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-tasks {
  padding: 40px;
  text-align: center;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .task-header {
    flex-direction: column;
    gap: 10px;
  }

  .task-actions {
    justify-content: center;
  }
}
</style>
