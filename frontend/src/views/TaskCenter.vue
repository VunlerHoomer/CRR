<template>
  <div class="task-center">
    <!-- 头部信息 -->
    <div class="task-header">
      <h1>任务中心</h1>
      <div class="user-info" v-if="userStore.user">
        <span class="user-name">{{ userStore.user.nickname }}</span>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <!-- 导航标签 -->
    <el-tabs v-model="activeTab" class="task-tabs">
      <el-tab-pane label="任务进度" name="progress">
        <div class="progress-content">
          <!-- 队伍信息卡片 -->
          <el-card class="team-card">
            <div class="team-header">
              <h3>队伍信息</h3>
              <el-button type="primary" size="small" @click="showTeamDialog = true">
                管理队伍
              </el-button>
            </div>
            <div class="team-details">
              <p><strong>队伍名称:</strong> {{ teamInfo.name }}</p>
              <p><strong>描述:</strong> {{ teamInfo.description }}</p>
              <div class="team-stats">
                <el-tag type="success">积分: {{ teamInfo.totalPoints }}</el-tag>
                <el-tag type="warning">已完成: {{ teamInfo.completedTasks }}</el-tag>
              </div>
            </div>
          </el-card>

          <!-- 筛选选项 -->
          <div class="filter-section">
            <el-checkbox v-model="onlyCurrentArea">仅显示当前区域</el-checkbox>
            <el-select v-model="selectedArea" placeholder="选择区域" clearable @change="fetchTasks">
              <el-option
                v-for="area in areas"
                :key="area._id"
                :label="area.name"
                :value="area._id"
              />
            </el-select>
          </div>

          <!-- 任务列表 -->
          <el-table :data="tasks" v-loading="loading" class="task-table">
            <el-table-column prop="taskId" label="任务ID" width="80" />
            <el-table-column prop="area.name" label="区域" width="150" />
            <el-table-column prop="name" label="任务名称" min-width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="attempts" label="尝试次数" width="100" />
            <el-table-column prop="completedAt" label="完成时间" width="150">
              <template #default="{ row }">
                {{ row.completedAt ? formatDate(row.completedAt) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.canStart" 
                  type="primary" 
                  size="small" 
                  @click="startTask(row)"
                >
                  开始
                </el-button>
                <el-button 
                  v-else-if="row.status === 'completed'" 
                  type="success" 
                  size="small" 
                  disabled
                >
                  已完成
                </el-button>
                <el-button 
                  v-else 
                  type="info" 
                  size="small" 
                  @click="viewTaskDetail(row)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="提交任务" name="submit">
        <div class="submit-content">
          <el-empty description="暂无待提交任务" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="谜题" name="puzzle">
        <div class="puzzle-content">
          <el-empty description="谜题功能开发中" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="新区域" name="area">
        <div class="area-content">
          <el-empty description="新区域功能开发中" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="道具" name="props">
        <div class="props-content">
          <el-empty description="道具功能开发中" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 队伍管理对话框 -->
    <el-dialog v-model="showTeamDialog" title="队伍管理" width="600px">
      <div v-if="!teamInfo">
        <el-empty description="您还未加入队伍">
          <el-button type="primary" @click="showCreateTeam = true">创建队伍</el-button>
          <el-button @click="showJoinTeam = true">加入队伍</el-button>
        </el-empty>
      </div>
      <div v-else>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="队伍名称">{{ teamInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="队长">{{ teamInfo.leader?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="成员数量">{{ teamInfo.members?.length || 0 }}</el-descriptions-item>
          <el-descriptions-item label="总积分">{{ teamInfo.totalPoints }}</el-descriptions-item>
          <el-descriptions-item label="已完成任务">{{ teamInfo.completedTasks }}</el-descriptions-item>
          <el-descriptions-item label="队伍等级">{{ teamInfo.level }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="team-actions" style="margin-top: 20px;">
          <el-button type="danger" @click="leaveTeam">退出队伍</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 创建队伍对话框 -->
    <el-dialog v-model="showCreateTeam" title="创建队伍" width="400px">
      <el-form :model="createTeamForm" label-width="80px">
        <el-form-item label="队伍名称">
          <el-input v-model="createTeamForm.name" placeholder="请输入队伍名称" />
        </el-form-item>
        <el-form-item label="队伍描述">
          <el-input 
            v-model="createTeamForm.description" 
            type="textarea" 
            placeholder="请输入队伍描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateTeam = false">取消</el-button>
        <el-button type="primary" @click="createTeam">创建</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="showTaskDetail" title="任务详情" width="800px">
      <div v-if="currentTask">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">{{ currentTask.taskId }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="区域">{{ currentTask.area?.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getTaskTypeText(currentTask.type) }}</el-descriptions-item>
          <el-descriptions-item label="难度">{{ getDifficultyText(currentTask.difficulty) }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ currentTask.points }}</el-descriptions-item>
          <el-descriptions-item label="最大尝试次数">{{ currentTask.maxAttempts }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(currentTask.status) }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="task-description" style="margin-top: 20px;">
          <h4>任务描述</h4>
          <p>{{ currentTask.description }}</p>
        </div>

        <div class="task-actions" style="margin-top: 20px;">
          <el-button 
            v-if="currentTask.canStart" 
            type="primary" 
            @click="startTask(currentTask)"
          >
            开始任务
          </el-button>
          <el-button @click="showTaskDetail = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('progress')
const loading = ref(false)
const tasks = ref([])
const teamInfo = ref({
  name: '测试队伍',
  description: '这是一个测试队伍',
  totalPoints: 35,
  completedTasks: 1
})
const areas = ref([])
const onlyCurrentArea = ref(false)
const selectedArea = ref('')

const showTeamDialog = ref(false)
const showCreateTeam = ref(false)
const showJoinTeam = ref(false)
const showTaskDetail = ref(false)
const currentTask = ref(null)

const createTeamForm = reactive({
  name: '',
  description: ''
})

// 模拟数据
const mockTasks = [
  {
    _id: '1',
    taskId: '1',
    name: '1-1',
    description: '在静安雕塑公园完成基础地理知识答题',
    area: { name: '静安雕塑公园' },
    type: 'quiz',
    difficulty: 'easy',
    points: 20,
    maxAttempts: 3,
    status: 'pending',
    attempts: 0,
    completedAt: null,
    canStart: true
  },
  {
    _id: '2',
    taskId: '2',
    name: '1-2',
    description: '在静安雕塑公园完成进阶历史知识答题',
    area: { name: '静安雕塑公园' },
    type: 'quiz',
    difficulty: 'medium',
    points: 30,
    maxAttempts: 2,
    status: 'pending',
    attempts: 0,
    completedAt: null,
    canStart: true
  },
  {
    _id: '3',
    taskId: '3',
    name: '2-1',
    description: '在人民广场完成位置签到任务',
    area: { name: '人民广场' },
    type: 'location',
    difficulty: 'easy',
    points: 15,
    maxAttempts: 5,
    status: 'completed',
    attempts: 1,
    completedAt: new Date(),
    canStart: false
  }
]

const mockTeamInfo = {
  _id: 'team1',
  name: '测试队伍',
  description: '这是一个测试队伍',
  leader: { _id: 'user1', nickname: userStore.user?.nickname || '队长' },
  members: [{ _id: 'user1', nickname: userStore.user?.nickname || '成员' }],
  totalPoints: 35,
  completedTasks: 1,
  level: 2
}

const mockAreas = [
  { _id: '1', name: '静安雕塑公园' },
  { _id: '2', name: '人民广场' },
  { _id: '3', name: '外滩' }
]

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let filteredTasks = [...mockTasks]
    
    if (selectedArea.value) {
      const areaName = mockAreas.find(a => a._id === selectedArea.value)?.name
      filteredTasks = filteredTasks.filter(task => task.area.name === areaName)
    }
    
    tasks.value = filteredTasks
    teamInfo.value = mockTeamInfo
    areas.value = mockAreas
  } catch (error) {
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 开始任务
const startTask = async (task) => {
  try {
    ElMessage.success('任务已开始')
    // 根据任务类型跳转到相应的执行页面
    if (task.type === 'quiz') {
      router.push(`/task/quiz/${task._id}`)
    } else {
      router.push(`/task/execute/${task._id}`)
    }
  } catch (error) {
    ElMessage.error('开始任务失败')
  }
}

// 查看任务详情
const viewTaskDetail = async (task) => {
  currentTask.value = task
  showTaskDetail.value = true
}

// 创建队伍
const createTeam = async () => {
  try {
    ElMessage.success('队伍创建成功')
    showCreateTeam.value = false
    createTeamForm.name = ''
    createTeamForm.description = ''
    teamInfo.value = {
      ...mockTeamInfo,
      name: createTeamForm.name || '新队伍'
    }
  } catch (error) {
    ElMessage.error('创建队伍失败')
  }
}

// 退出队伍
const leaveTeam = async () => {
  try {
    await ElMessageBox.confirm('确定要退出队伍吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    ElMessage.success('已退出队伍')
    teamInfo.value = null
    showTeamDialog.value = false
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('退出队伍失败')
    }
  }
}

// 退出登录
const logout = () => {
  userStore.logout()
  router.push('/login')
}

// 状态相关方法
const getStatusType = (status) => {
  const statusMap = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    failed: '已失败'
  }
  return statusMap[status] || '未知'
}

const getTaskTypeText = (type) => {
  const typeMap = {
    quiz: '答题',
    location: '位置',
    photo: '拍照',
    text: '文本',
    custom: '自定义'
  }
  return typeMap[type] || '未知'
}

const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return difficultyMap[difficulty] || '未知'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.task-center {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-header h1 {
  margin: 0;
  color: #303133;
  font-size: 28px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  font-size: 16px;
  color: #606266;
}

.task-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.team-card {
  margin-bottom: 20px;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.team-header h3 {
  margin: 0;
  color: #303133;
}

.team-details p {
  margin: 8px 0;
  color: #606266;
}

.team-stats {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.task-table {
  margin-top: 20px;
}

.team-actions {
  text-align: center;
}

@media (max-width: 768px) {
  .task-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .task-table {
    font-size: 14px;
  }
}
</style>
