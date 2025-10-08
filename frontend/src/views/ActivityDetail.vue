<template>
  <div class="activity-detail">
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

    <!-- 任务列表区域 -->
    <div class="task-section">
      <div class="task-header">
        <h1 class="task-title">任务列表</h1>
        <div class="task-controls">
          <div class="control-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="showCompleted" />
              <span class="checkbox-text">显示已完成</span>
            </label>
          </div>
          <div class="task-stats">
            <span class="task-count">{{ totalTasks }}个任务</span>
            <el-button size="small" type="warning" @click="clearProgress">
              清空进度
            </el-button>
          </div>
        </div>
        <div class="filter-row">
          <el-select v-model="selectedArea" placeholder="全部" size="small">
            <el-option label="全部" value="all" />
            <el-option 
              v-for="area in areas" 
              :key="area.id" 
              :label="area.name" 
              :value="area.id" 
            />
          </el-select>
          <el-select v-model="selectedStatus" placeholder="全部" size="small">
            <el-option label="全部" value="all" />
            <el-option label="未开始" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="task-list">
        <div 
          v-for="area in filteredAreas" 
          :key="area.id" 
          class="area-section"
        >
          <div class="area-header">
            <h3 class="area-title">{{ area.name }}</h3>
            <p class="area-description">{{ area.description }}</p>
            <div class="area-status">
              <el-tag 
                :type="getAreaStatusType(area.completionRate)"
                size="small"
              >
                {{ getAreaStatusText(area.completionRate) }}
              </el-tag>
            </div>
          </div>

          <div class="tasks-container">
            <div 
              v-for="task in area.tasks" 
              :key="task.id" 
              class="task-item"
              @click="openTask(task)"
            >
              <div class="task-content">
                <h4 class="task-name">{{ task.name }}</h4>
                <p class="task-description">{{ task.description }}</p>
              </div>
              <div class="task-status">
                <el-tag 
                  :type="getTaskStatusType(task.status)"
                  size="small"
                >
                  {{ getTaskStatusText(task.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 浮动操作按钮 -->
    <div class="floating-actions">
      <el-button 
        type="danger" 
        size="large" 
        circle 
        class="fab-button"
        @click="showActivityNav"
      >
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <div class="fab-text">
        <span>活动</span>
        <span>导航</span>
      </div>
    </div>

    <!-- 任务详情对话框 -->
    <el-dialog 
      v-model="showTaskDialog" 
      :title="selectedTask?.name" 
      width="90%"
      :before-close="closeTaskDialog"
    >
      <div v-if="selectedTask" class="task-detail">
        <div class="task-banner">
          <img :src="selectedTask.banner" :alt="selectedTask.name" />
        </div>
        <div class="task-info">
          <h3>{{ selectedTask.name }}</h3>
          <p>{{ selectedTask.description }}</p>
          <div class="task-meta">
            <div class="meta-item">
              <el-icon><Location /></el-icon>
              <span>{{ selectedTask.location }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>{{ selectedTask.duration }}分钟</span>
            </div>
            <div class="meta-item">
              <el-icon><Star /></el-icon>
              <span>{{ selectedTask.points }}积分</span>
            </div>
          </div>
        </div>
        <div class="task-actions">
          <el-button 
            v-if="selectedTask.status === 'pending'"
            type="primary" 
            size="large"
            @click="startTask"
          >
            开始任务
          </el-button>
          <el-button 
            v-else-if="selectedTask.status === 'in_progress'"
            type="success" 
            size="large"
            @click="continueTask"
          >
            继续任务
          </el-button>
          <el-button 
            v-else
            type="info" 
            size="large"
            disabled
          >
            已完成
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Box, Location, Clock, Star } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 响应式数据
const showCompleted = ref(false)
const selectedArea = ref('all')
const selectedStatus = ref('all')
const showTaskDialog = ref(false)
const selectedTask = ref(null)

// 任务数据
const areas = ref([
  {
    id: 'A',
    name: 'A-区域',
    description: '输入该区域地铁站以解锁1-6题答题框',
    completionRate: 100,
    tasks: [
      {
        id: 'A1',
        name: 'A1-任务',
        description: '找到指定地点并完成拍照任务',
        status: 'completed',
        location: '静安雕塑公园',
        duration: 30,
        points: 50,
        banner: 'https://placehold.co/400x200/67c23a/ffffff?text=A1任务'
      },
      {
        id: 'A2',
        name: 'A2-任务',
        description: '完成区域内的定向挑战',
        status: 'completed',
        location: '人民广场',
        duration: 45,
        points: 80,
        banner: 'https://placehold.co/400x200/409eff/ffffff?text=A2任务'
      },
      {
        id: 'A3',
        name: 'A3-任务',
        description: '团队协作完成指定任务',
        status: 'completed',
        location: '外滩',
        duration: 60,
        points: 100,
        banner: 'https://placehold.co/400x200/e6a23c/ffffff?text=A3任务'
      },
      {
        id: 'A4',
        name: 'A4-任务',
        description: '完成最后的挑战任务',
        status: 'completed',
        location: '南京路',
        duration: 40,
        points: 70,
        banner: 'https://placehold.co/400x200/f56c6c/ffffff?text=A4任务'
      }
    ]
  },
  {
    id: 'B',
    name: 'B-区域',
    description: '探索历史文化区域，完成相关任务',
    completionRate: 60,
    tasks: [
      {
        id: 'B1',
        name: 'B1-任务',
        description: '参观历史建筑并回答问题',
        status: 'completed',
        location: '豫园',
        duration: 50,
        points: 90,
        banner: 'https://placehold.co/400x200/909399/ffffff?text=B1任务'
      },
      {
        id: 'B2',
        name: 'B2-任务',
        description: '寻找隐藏的文化标识',
        status: 'in_progress',
        location: '城隍庙',
        duration: 35,
        points: 60,
        banner: 'https://placehold.co/400x200/67c23a/ffffff?text=B2任务'
      },
      {
        id: 'B3',
        name: 'B3-任务',
        description: '完成团队挑战任务',
        status: 'pending',
        location: '田子坊',
        duration: 55,
        points: 110,
        banner: 'https://placehold.co/400x200/409eff/ffffff?text=B3任务'
      }
    ]
  },
  {
    id: 'C',
    name: 'C-区域',
    description: '现代都市探索区域，体验城市魅力',
    completionRate: 25,
    tasks: [
      {
        id: 'C1',
        name: 'C1-任务',
        description: '探索现代建筑群',
        status: 'pending',
        location: '陆家嘴',
        duration: 70,
        points: 120,
        banner: 'https://placehold.co/400x200/e6a23c/ffffff?text=C1任务'
      },
      {
        id: 'C2',
        name: 'C2-任务',
        description: '完成高空挑战',
        status: 'pending',
        location: '东方明珠',
        duration: 45,
        points: 85,
        banner: 'https://placehold.co/400x200/f56c6c/ffffff?text=C2任务'
      }
    ]
  }
])

// 计算属性
const totalTasks = computed(() => {
  return areas.value.reduce((total, area) => total + area.tasks.length, 0)
})

const filteredAreas = computed(() => {
  let filtered = areas.value

  // 按区域筛选
  if (selectedArea.value !== 'all') {
    filtered = filtered.filter(area => area.id === selectedArea.value)
  }

  // 按状态筛选
  if (selectedStatus.value !== 'all') {
    filtered = filtered.map(area => ({
      ...area,
      tasks: area.tasks.filter(task => {
        if (selectedStatus.value === 'completed') {
          return task.status === 'completed'
        } else if (selectedStatus.value === 'in_progress') {
          return task.status === 'in_progress'
        } else if (selectedStatus.value === 'pending') {
          return task.status === 'pending'
        }
        return true
      })
    })).filter(area => area.tasks.length > 0)
  }

  // 是否显示已完成的任务
  if (!showCompleted.value) {
    filtered = filtered.map(area => ({
      ...area,
      tasks: area.tasks.filter(task => task.status !== 'completed')
    })).filter(area => area.tasks.length > 0)
  }

  return filtered
})

// 方法
const goBack = () => {
  router.back()
}

const clearProgress = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有任务进度吗？此操作不可撤销。',
      '确认清空',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 重置所有任务状态
    areas.value.forEach(area => {
      area.tasks.forEach(task => {
        task.status = 'pending'
      })
    })
    
    ElMessage.success('进度已清空')
  } catch {
    // 用户取消操作
  }
}

const openTask = (task) => {
  selectedTask.value = task
  showTaskDialog.value = true
}

const closeTaskDialog = () => {
  showTaskDialog.value = false
  selectedTask.value = null
}

const startTask = () => {
  if (selectedTask.value) {
    selectedTask.value.status = 'in_progress'
    ElMessage.success('任务已开始！')
    closeTaskDialog()
  }
}

const continueTask = () => {
  ElMessage.info('继续任务功能开发中...')
  closeTaskDialog()
}

const showActivityNav = () => {
  router.push('/activity-center')
}

// 状态相关方法
const getAreaStatusType = (completionRate) => {
  if (completionRate === 100) return 'success'
  if (completionRate >= 50) return 'warning'
  return 'danger'
}

const getAreaStatusText = (completionRate) => {
  if (completionRate === 100) return '已完成'
  if (completionRate >= 50) return '进行中'
  return '未开始'
}

const getTaskStatusType = (status) => {
  const typeMap = {
    completed: 'success',
    in_progress: 'warning',
    pending: 'info'
  }
  return typeMap[status] || 'info'
}

const getTaskStatusText = (status) => {
  const textMap = {
    completed: '已完成',
    in_progress: '进行中',
    pending: '未开始'
  }
  return textMap[status] || '未知'
}

onMounted(() => {
  // 根据路由参数加载活动详情
  const activityId = route.params.id
  console.log('加载活动详情:', activityId)
})
</script>

<style scoped>
.activity-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
}

/* 顶部导航栏 */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-bar {
  background: #1a1a1a;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-left, .nav-right {
  flex: 1;
}

.nav-center {
  display: flex;
  justify-content: center;
}

.nav-logo {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-button {
  color: white !important;
  padding: 8px;
}

/* 任务列表区域 */
.task-section {
  background: #f8f6f0;
  min-height: calc(100vh - 60px);
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.task-header {
  margin-bottom: 30px;
}

.task-title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
}

.task-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #409eff;
}

.checkbox-text {
  user-select: none;
}

.task-stats {
  display: flex;
  align-items: center;
  gap: 15px;
}

.task-count {
  background: #e8f4fd;
  color: #409eff;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: center;
}

.filter-row .el-select {
  width: 120px;
}

/* 任务列表 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.area-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.area-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  position: relative;
}

.area-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 10px 0;
}

.area-description {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 15px 0;
  line-height: 1.4;
}

.area-status {
  position: absolute;
  top: 20px;
  right: 20px;
}

.tasks-container {
  padding: 20px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;
}

.task-item:hover {
  background: #f0f9ff;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.task-item:last-child {
  margin-bottom: 0;
}

.task-content {
  flex: 1;
}

.task-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px 0;
}

.task-description {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.task-status {
  margin-left: 15px;
}

/* 浮动操作按钮 */
.floating-actions {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 50;
}

.fab-button {
  width: 60px !important;
  height: 60px !important;
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.3);
}

.fab-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #666;
  font-weight: 500;
  line-height: 1.2;
}

/* 任务详情对话框 */
.task-detail {
  padding: 20px;
}

.task-banner {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.task-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.task-info h3 {
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 15px 0;
}

.task-info p {
  color: #666;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.meta-item .el-icon {
  color: #409eff;
}

.task-actions {
  text-align: center;
}

.task-actions .el-button {
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-section {
    padding: 15px;
  }
  
  .task-title {
    font-size: 1.5rem;
  }
  
  .task-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-row {
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-row .el-select {
    flex: 1;
    max-width: calc(50% - 7.5px);
  }
  
  .floating-actions {
    right: 15px;
    bottom: 20px;
    top: auto;
    transform: none;
  }
  
  .fab-button {
    width: 50px !important;
    height: 50px !important;
  }
  
  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .task-status {
    margin-left: 0;
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .nav-content {
    padding: 10px 15px;
  }
  
  .task-section {
    padding: 10px;
  }
  
  .area-header {
    padding: 15px;
  }
  
  .tasks-container {
    padding: 15px;
  }
  
  .task-item {
    padding: 12px;
  }
}
</style>
