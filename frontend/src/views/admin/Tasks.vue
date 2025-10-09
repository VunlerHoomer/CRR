<template>
  <div class="admin-tasks">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              新增任务
            </el-button>
            <el-button @click="fetchTasks">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :model="filterForm" inline>
          <el-form-item label="活动">
            <el-select 
              v-model="filterForm.activityId" 
              placeholder="选择活动" 
              clearable 
              @change="fetchTasks"
              style="width: 200px"
            >
              <el-option 
                v-for="activity in activities" 
                :key="activity._id" 
                :label="activity.title" 
                :value="activity._id" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="任务类型">
            <el-select v-model="filterForm.type" placeholder="选择类型" clearable @change="fetchTasks">
              <el-option label="答题" value="quiz" />
              <el-option label="位置签到" value="location" />
              <el-option label="拍照" value="photo" />
              <el-option label="文本" value="text" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>
          <el-form-item label="难度">
            <el-select v-model="filterForm.difficulty" placeholder="选择难度" clearable @change="fetchTasks">
              <el-option label="简单" value="easy" />
              <el-option label="中等" value="medium" />
              <el-option label="困难" value="hard" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.isActive" placeholder="选择状态" clearable @change="fetchTasks">
              <el-option label="启用" value="true" />
              <el-option label="禁用" value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchTasks">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 任务列表 -->
      <el-table :data="tasks" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="任务名称" width="120" />
        <el-table-column prop="description" label="任务描述" min-width="200" />
        <el-table-column prop="activity.title" label="所属活动" width="150" />
        <el-table-column prop="area" label="区域" width="120" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="getDifficultyTagType(row.difficulty)">
              {{ getDifficultyText(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="80" />
        <el-table-column prop="maxAttempts" label="最大尝试次数" width="120" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="统计" width="150">
          <template #default="{ row }">
            <div class="stats">
              <div>尝试: {{ row.stats?.totalAttempts || 0 }}</div>
              <div>完成: {{ row.stats?.completedCount || 0 }}</div>
              <div>完成率: {{ row.stats?.completionRate || 0 }}%</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewTask(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editTask(row)">编辑</el-button>
            <el-button size="small" type="info" @click="viewRecords(row)">记录</el-button>
            <el-button size="small" type="danger" @click="deleteTask(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchTasks"
        @current-change="fetchTasks"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 创建/编辑任务对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      :title="editingTask ? '编辑任务' : '新增任务'" 
      width="800px"
    >
      <el-form 
        ref="taskFormRef"
        :model="taskForm" 
        :rules="taskRules"
        label-width="120px"
      >
        <el-form-item label="所属活动" prop="activity">
          <el-select v-model="taskForm.activity" placeholder="选择活动" style="width: 100%">
            <el-option 
              v-for="activity in activities" 
              :key="activity._id" 
              :label="activity.title" 
              :value="activity._id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="如：1-1、2-1等" />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input 
            v-model="taskForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="详细描述任务内容"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务类型" prop="type">
              <el-select v-model="taskForm.type" placeholder="选择类型" style="width: 100%">
                <el-option label="答题" value="quiz" />
                <el-option label="位置签到" value="location" />
                <el-option label="拍照" value="photo" />
                <el-option label="文本" value="text" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务难度" prop="difficulty">
              <el-select v-model="taskForm.difficulty" placeholder="选择难度" style="width: 100%">
                <el-option label="简单" value="easy" />
                <el-option label="中等" value="medium" />
                <el-option label="困难" value="hard" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务区域" prop="area">
              <el-input v-model="taskForm.area" placeholder="如：静安雕塑公园" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务积分" prop="points">
              <el-input-number v-model="taskForm.points" :min="1" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最大尝试次数" prop="maxAttempts">
              <el-input-number v-model="taskForm.maxAttempts" :min="1" :max="10" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="order">
              <el-input-number v-model="taskForm.order" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="任务状态">
          <el-switch v-model="taskForm.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTask" :loading="submitting">
          {{ editingTask ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="任务详情" width="600px">
      <div v-if="currentTask">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="所属活动">{{ currentTask.activity?.title }}</el-descriptions-item>
          <el-descriptions-item label="任务描述" :span="2">{{ currentTask.description }}</el-descriptions-item>
          <el-descriptions-item label="任务区域">{{ currentTask.area }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">{{ getTypeText(currentTask.type) }}</el-descriptions-item>
          <el-descriptions-item label="任务难度">{{ getDifficultyText(currentTask.difficulty) }}</el-descriptions-item>
          <el-descriptions-item label="任务积分">{{ currentTask.points }}</el-descriptions-item>
          <el-descriptions-item label="最大尝试次数">{{ currentTask.maxAttempts }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="currentTask.isActive ? 'success' : 'danger'">
              {{ currentTask.isActive ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="排序">{{ currentTask.order }}</el-descriptions-item>
          <el-descriptions-item label="创建者">{{ currentTask.createdBy?.username }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentTask.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 任务记录对话框 -->
    <el-dialog v-model="showRecordsDialog" title="任务完成记录" width="800px">
      <div v-if="currentTask">
        <div class="task-info">
          <h3>{{ currentTask.name }} - {{ currentTask.description }}</h3>
        </div>
        
        <el-table :data="taskRecords" v-loading="recordsLoading" style="width: 100%">
          <el-table-column prop="user.username" label="用户名" width="120" />
          <el-table-column prop="user.phone" label="手机号" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="completion.attempts" label="尝试次数" width="100" />
          <el-table-column prop="completion.score" label="得分" width="80" />
          <el-table-column prop="completion.completedAt" label="完成时间" width="150">
            <template #default="{ row }">
              {{ row.completion.completedAt ? formatDate(row.completion.completedAt) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="开始时间" width="150">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useAdminStore } from '@/store/admin'

const adminStore = useAdminStore()

const loading = ref(false)
const submitting = ref(false)
const recordsLoading = ref(false)
const tasks = ref([])
const activities = ref([])
const taskRecords = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showRecordsDialog = ref(false)
const editingTask = ref(null)
const currentTask = ref(null)

const filterForm = ref({
  activityId: '',
  type: '',
  difficulty: '',
  isActive: ''
})

const taskForm = ref({
  activity: '',
  name: '',
  description: '',
  type: 'quiz',
  difficulty: 'medium',
  area: '',
  points: 20,
  maxAttempts: 3,
  order: 0,
  isActive: true
})

const taskRules = {
  activity: [{ required: true, message: '请选择活动', trigger: 'change' }],
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入任务描述', trigger: 'blur' }],
  type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择任务难度', trigger: 'change' }],
  area: [{ required: true, message: '请输入任务区域', trigger: 'blur' }],
  points: [{ required: true, message: '请输入任务积分', trigger: 'blur' }],
  maxAttempts: [{ required: true, message: '请输入最大尝试次数', trigger: 'blur' }]
}

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filterForm.value
    }

    const response = await adminStore.request.get('/admin/tasks/list', { params })
    if (response.code === 200) {
      tasks.value = response.data.tasks
      total.value = response.data.pagination.total
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 获取活动列表
const fetchActivities = async () => {
  try {
    const response = await adminStore.request.get('/admin/activity/list', {
      params: { limit: 100 }
    })
    if (response.code === 200) {
      activities.value = response.data.activities || []
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
    ElMessage.error('获取活动列表失败')
  }
}

// 获取任务记录
const fetchTaskRecords = async (taskId) => {
  recordsLoading.value = true
  try {
    const response = await adminStore.request.get(`/admin/tasks/${taskId}/records`)
    if (response.code === 200) {
      taskRecords.value = response.data.records
    }
  } catch (error) {
    console.error('获取任务记录失败:', error)
    ElMessage.error('获取任务记录失败')
  } finally {
    recordsLoading.value = false
  }
}

// 提交任务表单
const submitTask = async () => {
  try {
    const data = editingTask.value 
      ? { ...taskForm.value, _id: editingTask.value._id }
      : taskForm.value

    const response = editingTask.value
      ? await adminStore.request.put(`/admin/tasks/${editingTask.value._id}`, data)
      : await adminStore.request.post('/admin/tasks/create', data)

    if (response.code === 200) {
      ElMessage.success(editingTask.value ? '任务更新成功' : '任务创建成功')
      showCreateDialog.value = false
      resetTaskForm()
      fetchTasks()
    }
  } catch (error) {
    console.error('提交任务失败:', error)
    ElMessage.error('提交任务失败')
  }
}

// 查看任务详情
const viewTask = async (task) => {
  try {
    const response = await adminStore.request.get(`/admin/tasks/${task._id}`)
    if (response.code === 200) {
      currentTask.value = response.data.task
      showDetailDialog.value = true
    }
  } catch (error) {
    console.error('获取任务详情失败:', error)
    ElMessage.error('获取任务详情失败')
  }
}

// 编辑任务
const editTask = (task) => {
  editingTask.value = task
  taskForm.value = {
    activity: task.activity._id,
    name: task.name,
    description: task.description,
    type: task.type,
    difficulty: task.difficulty,
    area: task.area,
    points: task.points,
    maxAttempts: task.maxAttempts,
    order: task.order,
    isActive: task.isActive
  }
  showCreateDialog.value = true
}

// 查看任务记录
const viewRecords = async (task) => {
  currentTask.value = task
  showRecordsDialog.value = true
  await fetchTaskRecords(task._id)
}

// 删除任务
const deleteTask = async (task) => {
  try {
    await ElMessageBox.confirm('确定要删除这个任务吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await adminStore.request.delete(`/admin/tasks/${task._id}`)
    if (response.code === 200) {
      ElMessage.success('任务删除成功')
      fetchTasks()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除任务失败:', error)
      ElMessage.error('删除任务失败')
    }
  }
}

// 重置表单
const resetTaskForm = () => {
  taskForm.value = {
    activity: '',
    name: '',
    description: '',
    type: 'quiz',
    difficulty: 'medium',
    area: '',
    points: 20,
    maxAttempts: 3,
    order: 0,
    isActive: true
  }
  editingTask.value = null
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

const getStatusText = (status) => {
  const statuses = {
    pending: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    failed: '失败',
    abandoned: '已放弃'
  }
  return statuses[status] || status
}

const getStatusTagType = (status) => {
  const types = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    failed: 'danger',
    abandoned: 'info'
  }
  return types[status] || 'info'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchTasks()
  fetchActivities()
})
</script>

<style scoped>
.admin-tasks {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.stats {
  font-size: 12px;
  line-height: 1.4;
}

.stats div {
  margin-bottom: 2px;
}

.task-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.task-info h3 {
  margin: 0;
  color: #333;
}
</style>