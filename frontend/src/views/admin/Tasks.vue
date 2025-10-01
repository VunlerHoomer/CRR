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
          <el-form-item label="任务名称">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索任务名称或描述"
              clearable
              @clear="fetchTasks"
              @keyup.enter="fetchTasks"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="任务类型">
            <el-select v-model="filterForm.type" placeholder="选择类型" clearable @change="fetchTasks">
              <el-option label="答题" value="quiz" />
              <el-option label="位置" value="location" />
              <el-option label="拍照" value="photo" />
              <el-option label="文本" value="text" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="选择状态" clearable @change="fetchTasks">
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
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
      <el-table
        :data="tasks"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="taskId" label="任务ID" width="80" />
        <el-table-column prop="name" label="任务名称" width="120" />
        <el-table-column prop="area" label="区域" width="120" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="getDifficultyTagType(row.difficulty)" size="small">
              {{ getDifficultyText(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="80" />
        <el-table-column prop="totalAttempts" label="尝试次数" width="100" />
        <el-table-column prop="completedCount" label="完成次数" width="100" />
        <el-table-column prop="completionRate" label="完成率" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.completionRate" 
              :stroke-width="8"
              :show-text="false"
            />
            <span style="margin-left: 8px">{{ row.completionRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" @click="viewTaskDetail(row)">详情</el-button>
            <el-button type="primary" size="small" @click="editTask(row)">编辑</el-button>
            <el-button 
              :type="row.isActive ? 'warning' : 'success'" 
              size="small" 
              @click="toggleTaskStatus(row)"
            >
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteTask(row)">删除</el-button>
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

    <!-- 任务详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="任务详情" width="800px">
      <div v-if="currentTask">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">{{ currentTask.taskId }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="区域">{{ currentTask.area }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getTypeText(currentTask.type) }}</el-descriptions-item>
          <el-descriptions-item label="难度">{{ getDifficultyText(currentTask.difficulty) }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ currentTask.points }}</el-descriptions-item>
          <el-descriptions-item label="最大尝试次数">{{ currentTask.maxAttempts }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentTask.isActive ? '启用' : '禁用' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ formatDate(currentTask.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="task-description" style="margin-top: 20px;">
          <h4>任务描述</h4>
          <p>{{ currentTask.description }}</p>
        </div>

        <div class="task-statistics" style="margin-top: 20px;">
          <h4>统计数据</h4>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总尝试次数" :value="currentTask.totalAttempts" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="完成次数" :value="currentTask.completedCount" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="完成率" :value="currentTask.completionRate" suffix="%" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总积分" :value="currentTask.totalPoints || 0" />
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>

    <!-- 创建/编辑任务对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      :title="isEdit ? '编辑任务' : '新增任务'" 
      width="600px"
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskRules"
        label-width="100px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input 
            v-model="taskForm.description" 
            type="textarea" 
            placeholder="请输入任务描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="区域" prop="area">
          <el-select v-model="taskForm.area" placeholder="选择区域">
            <el-option label="静安雕塑公园" value="静安雕塑公园" />
            <el-option label="人民广场" value="人民广场" />
            <el-option label="外滩" value="外滩" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务类型" prop="type">
          <el-select v-model="taskForm.type" placeholder="选择任务类型">
            <el-option label="答题" value="quiz" />
            <el-option label="位置" value="location" />
            <el-option label="拍照" value="photo" />
            <el-option label="文本" value="text" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-radio-group v-model="taskForm.difficulty">
            <el-radio label="easy">简单</el-radio>
            <el-radio label="medium">中等</el-radio>
            <el-radio label="hard">困难</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="积分" prop="points">
          <el-input-number v-model="taskForm.points" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="最大尝试次数" prop="maxAttempts">
          <el-input-number v-model="taskForm.maxAttempts" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="taskForm.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTask" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/store/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'

const adminStore = useAdminStore()

const loading = ref(false)
const submitting = ref(false)
const detailDialogVisible = ref(false)
const showCreateDialog = ref(false)
const isEdit = ref(false)

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const tasks = ref([])
const currentTask = ref(null)

const filterForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

const taskFormRef = ref()
const taskForm = reactive({
  name: '',
  description: '',
  area: '',
  type: '',
  difficulty: 'easy',
  points: 10,
  maxAttempts: 3,
  isActive: true
})

const taskRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入任务描述', trigger: 'blur' }
  ],
  area: [
    { required: true, message: '请选择区域', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ],
  points: [
    { required: true, message: '请输入积分', trigger: 'blur' }
  ]
}

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filterForm
    }

    const response = await adminStore.request.get('/dashboard/tasks', { params })
    if (response.code === 200) {
      tasks.value = response.data.tasks
      total.value = response.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 查看任务详情
const viewTaskDetail = async (task) => {
  try {
    const response = await adminStore.request.get(`/tasks/${task._id}`)
    if (response.code === 200) {
      currentTask.value = response.data.task
      detailDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取任务详情失败')
  }
}

// 编辑任务
const editTask = (task) => {
  isEdit.value = true
  Object.assign(taskForm, {
    _id: task._id,
    name: task.name,
    description: task.description,
    area: task.area,
    type: task.type,
    difficulty: task.difficulty,
    points: task.points,
    maxAttempts: task.maxAttempts,
    isActive: task.isActive
  })
  showCreateDialog.value = true
}

// 提交任务
const submitTask = async () => {
  if (!taskFormRef.value) return
  
  try {
    await taskFormRef.value.validate()
    submitting.value = true

    const url = isEdit.value ? `/tasks/${taskForm._id}` : '/tasks/create'
    const method = isEdit.value ? 'put' : 'post'
    
    const response = await adminStore.request[method](url, taskForm)
    
    if (response.code === 200) {
      ElMessage.success(isEdit.value ? '任务更新成功' : '任务创建成功')
      showCreateDialog.value = false
      resetForm()
      fetchTasks()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 切换任务状态
const toggleTaskStatus = async (task) => {
  try {
    const newStatus = !task.isActive
    const response = await adminStore.request.put(`/tasks/${task._id}`, {
      isActive: newStatus
    })
    
    if (response.code === 200) {
      task.isActive = newStatus
      ElMessage.success(newStatus ? '任务已启用' : '任务已禁用')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除任务
const deleteTask = (task) => {
  ElMessageBox.confirm(
    `确定要删除任务 "${task.name}" 吗？删除后将无法恢复！`,
    '警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await adminStore.request.delete(`/tasks/${task._id}`)
      if (response.code === 200) {
        ElMessage.success('删除成功')
        fetchTasks()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 重置表单
const resetForm = () => {
  Object.assign(taskForm, {
    name: '',
    description: '',
    area: '',
    type: '',
    difficulty: 'easy',
    points: 10,
    maxAttempts: 3,
    isActive: true
  })
  isEdit.value = false
  taskFormRef.value?.resetFields()
}

// 工具函数
const getTypeText = (type) => {
  const typeMap = {
    quiz: '答题',
    location: '位置',
    photo: '拍照',
    text: '文本'
  }
  return typeMap[type] || '未知'
}

const getTypeTagType = (type) => {
  const typeMap = {
    quiz: 'primary',
    location: 'success',
    photo: 'warning',
    text: 'info'
  }
  return typeMap[type] || 'info'
}

const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return difficultyMap[difficulty] || '未知'
}

const getDifficultyTagType = (difficulty) => {
  const difficultyMap = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return difficultyMap[difficulty] || 'info'
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
  background: #f8f9fa;
  border-radius: 8px;
}

.task-statistics {
  margin-top: 20px;
}

.task-statistics h4 {
  margin-bottom: 15px;
  color: #303133;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .filter-section .el-form {
    flex-direction: column;
  }
  
  .filter-section .el-form-item {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>
