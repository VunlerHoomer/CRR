<template>
  <div class="admin-task">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="openCreateDialog">
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
          <el-form-item label="所属活动">
            <el-select 
              v-model="filterForm.activityId" 
              placeholder="选择活动" 
              clearable 
              @change="onActivityChange" 
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
          <el-form-item label="所属区域">
            <el-select 
              v-model="filterForm.areaId" 
              placeholder="选择区域" 
              clearable 
              @change="fetchTasks" 
              style="width: 200px"
            >
              <el-option
                v-for="area in areas"
                :key="area._id"
                :label="area.name"
                :value="area._id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="任务类型">
            <el-select 
              v-model="filterForm.type" 
              placeholder="选择类型" 
              clearable 
              @change="fetchTasks" 
              style="width: 150px"
            >
              <el-option label="文本题" value="text" />
              <el-option label="数字题" value="number" />
              <el-option label="单选题" value="choice" />
              <el-option label="多选题" value="multiple" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索任务标题或问题"
              @keyup.enter="fetchTasks"
              style="width: 200px"
            >
              <template #append>
                <el-button @click="fetchTasks">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 任务列表 -->
      <el-table 
        :data="tasks" 
        v-loading="loading"
        row-key="_id"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="order" label="顺序" width="80" sortable="custom">
          <template #default="{ row }">
            <el-tag size="small">{{ row.order }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="任务标题" min-width="150">
          <template #default="{ row }">
            <div class="task-title">
              <span>{{ row.title }}</span>
              <el-tag 
                :type="getDifficultyType(row.difficulty)" 
                size="small" 
                style="margin-left: 8px"
              >
                {{ getDifficultyText(row.difficulty) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="questionType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.questionType)" size="small">
              {{ getTypeText(row.questionType) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="area" label="所属区域" width="120">
          <template #default="{ row }">
            <div class="area-info">
              <span class="area-icon">{{ row.area?.icon || '📍' }}</span>
              <span>{{ row.area?.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="points" label="分数" width="80">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.points }}分</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="question" label="问题" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.isActive"
              @change="toggleActive(row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewTask(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button size="small" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteTask(row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchTasks"
          @current-change="fetchTasks"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '新增任务'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="所属活动" prop="activity">
          <el-select v-model="form.activity" placeholder="请选择活动" @change="onFormActivityChange" style="width: 100%">
            <el-option
              v-for="activity in activities"
              :key="activity._id"
              :label="activity.title"
              :value="activity._id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="所属区域" prop="area">
          <el-select v-model="form.area" placeholder="请选择区域" style="width: 100%">
            <el-option
              v-for="area in formAreas"
              :key="area._id"
              :label="area.name"
              :value="area._id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="任务标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入任务标题" />
        </el-form-item>
        
        <el-form-item label="任务描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        
        <el-form-item label="问题内容" prop="question">
          <el-input
            v-model="form.question"
            type="textarea"
            :rows="3"
            placeholder="请输入问题内容"
          />
        </el-form-item>
        
        <el-form-item label="问题类型" prop="questionType">
          <el-select v-model="form.questionType" @change="onQuestionTypeChange" style="width: 100%">
            <el-option label="文本题" value="text" />
            <el-option label="数字题" value="number" />
            <el-option label="单选题" value="choice" />
            <el-option label="多选题" value="multiple" />
          </el-select>
        </el-form-item>
        
        <!-- 选择题选项 -->
        <el-form-item v-if="form.questionType === 'choice' || form.questionType === 'multiple'" label="选项">
          <div v-for="(option, index) in form.options" :key="index" class="option-item">
            <el-input v-model="option.label" placeholder="选项标签" style="width: 200px; margin-right: 10px" />
            <el-input v-model="option.value" placeholder="选项值" style="width: 200px; margin-right: 10px" />
            <el-button @click="removeOption(index)" type="danger" size="small">删除</el-button>
          </div>
          <el-button @click="addOption" type="primary" size="small">添加选项</el-button>
        </el-form-item>
        
        <!-- 标准答案 -->
        <el-form-item label="标准答案" prop="correctAnswer">
          <el-input v-model="form.correctAnswer" placeholder="请输入标准答案" />
        </el-form-item>
        
        <!-- 多选题答案 -->
        <el-form-item v-if="form.questionType === 'multiple'" label="正确答案">
          <el-select v-model="form.correctAnswers" multiple placeholder="选择正确答案" style="width: 100%">
            <el-option
              v-for="option in form.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="答案匹配">
          <el-select v-model="form.answerMatchType" style="width: 100%">
            <el-option label="精确匹配" value="exact" />
            <el-option label="包含匹配" value="contains" />
            <el-option label="正则匹配" value="regex" />
            <el-option label="数字匹配" value="number" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="忽略大小写">
          <el-switch v-model="form.caseSensitive" />
        </el-form-item>
        
        <el-form-item v-if="form.answerMatchType === 'number'" label="数字容差">
          <el-input-number v-model="form.numberTolerance" :min="0" :step="0.1" />
        </el-form-item>
        
        <el-form-item label="提示信息">
          <el-input
            v-model="form.hint"
            type="textarea"
            :rows="2"
            placeholder="请输入提示信息"
          />
        </el-form-item>
        
        <el-form-item label="任务分数" prop="points">
          <el-input-number v-model="form.points" :min="0" />
        </el-form-item>
        
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="form.order" :min="0" />
        </el-form-item>
        
        <el-form-item label="最大尝试">
          <el-input-number v-model="form.maxAttempts" :min="0" />
          <span style="margin-left: 8px; color: #999;">0表示无限制</span>
        </el-form-item>
        
        <el-form-item label="难度等级">
          <el-select v-model="form.difficulty" style="width: 100%">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看任务详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="任务详情"
      width="600px"
    >
      <div v-if="currentTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务标题">{{ currentTask.title }}</el-descriptions-item>
          <el-descriptions-item label="问题类型">
            <el-tag :type="getTypeColor(currentTask.questionType)">
              {{ getTypeText(currentTask.questionType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属区域">{{ currentTask.area?.name }}</el-descriptions-item>
          <el-descriptions-item label="任务分数">
            <el-tag type="warning">{{ currentTask.points }}分</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="难度等级">
            <el-tag :type="getDifficultyType(currentTask.difficulty)">
              {{ getDifficultyText(currentTask.difficulty) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最大尝试">
            {{ currentTask.maxAttempts === 0 ? '无限制' : currentTask.maxAttempts + '次' }}
          </el-descriptions-item>
          <el-descriptions-item label="问题内容" :span="2">
            {{ currentTask.question }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentTask.description" label="任务描述" :span="2">
            {{ currentTask.description }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentTask.hint" label="提示信息" :span="2">
            {{ currentTask.hint }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Edit, Delete, View } from '@element-plus/icons-vue'
import { useAdminStore } from '@/store/admin'

const adminStore = useAdminStore()

// 数据
const tasks = ref([])
const activities = ref([])
const areas = ref([])
const formAreas = ref([])
const loading = ref(false)
const submitting = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 筛选表单
const filterForm = ref({
  activityId: '',
  areaId: '',
  type: '',
  keyword: ''
})

// 对话框
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const currentTask = ref(null)
const formRef = ref()

// 表单数据
const form = ref({
  activity: '',
  area: '',
  title: '',
  description: '',
  question: '',
  questionType: 'text',
  options: [],
  correctAnswer: '',
  correctAnswers: [],
  answerMatchType: 'exact',
  caseSensitive: false,
  numberTolerance: 0,
  hint: '',
  points: 10,
  order: 0,
  maxAttempts: 0,
  difficulty: 'medium',
  isActive: true
})

// 表单验证规则
const rules = {
  activity: [{ required: true, message: '请选择活动', trigger: 'change' }],
  area: [{ required: true, message: '请选择区域', trigger: 'change' }],
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  question: [{ required: true, message: '请输入问题内容', trigger: 'blur' }],
  questionType: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
  correctAnswer: [{ required: true, message: '请输入标准答案', trigger: 'blur' }],
  points: [{ required: true, message: '请输入任务分数', trigger: 'blur' }],
  order: [{ required: true, message: '请输入排序', trigger: 'blur' }]
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

    const response = await adminStore.request.get('/admin/task/list', { params })
    
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
  }
}

// 获取区域列表
const fetchAreas = async (activityId = null) => {
  try {
    const params = { limit: 100 }
    if (activityId) params.activityId = activityId
    
    const response = await adminStore.request.get('/admin/area/list', { params })
    
    if (response.code === 200) {
      areas.value = response.data.areas || []
    }
  } catch (error) {
    console.error('获取区域列表失败:', error)
  }
}

// 活动选择变化
const onActivityChange = async () => {
  filterForm.value.areaId = ''
  await fetchAreas(filterForm.value.activityId)
  fetchTasks()
}

// 表单活动选择变化
const onFormActivityChange = async () => {
  form.value.area = ''
  await fetchAreas(form.value.activity)
  formAreas.value = areas.value
}

// 问题类型变化
const onQuestionTypeChange = () => {
  if (form.value.questionType === 'choice' || form.value.questionType === 'multiple') {
    if (form.value.options.length === 0) {
      form.value.options = [{ label: '', value: '' }, { label: '', value: '' }]
    }
  } else {
    form.value.options = []
    form.value.correctAnswers = []
  }
}

// 添加选项
const addOption = () => {
  form.value.options.push({ label: '', value: '' })
}

// 删除选项
const removeOption = (index) => {
  form.value.options.splice(index, 1)
}

// 打开创建对话框
const openCreateDialog = () => {
  isEdit.value = false
  form.value = {
    activity: filterForm.value.activityId || '',
    area: filterForm.value.areaId || '',
    title: '',
    description: '',
    question: '',
    questionType: 'text',
    options: [],
    correctAnswer: '',
    correctAnswers: [],
    answerMatchType: 'exact',
    caseSensitive: false,
    numberTolerance: 0,
    hint: '',
    points: 10,
    order: 0,
    maxAttempts: 0,
    difficulty: 'medium',
    isActive: true
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (task) => {
  isEdit.value = true
  form.value = { ...task }
  formAreas.value = areas.value.filter(area => area.activity._id === task.activity._id)
  dialogVisible.value = true
}

// 查看任务详情
const viewTask = (task) => {
  currentTask.value = task
  viewDialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    const url = isEdit.value ? `/admin/task/${form.value._id}` : '/admin/task'
    const method = isEdit.value ? 'put' : 'post'
    
    const response = await adminStore.request[method](url, form.value)
    
    if (response.code === 200) {
      ElMessage.success(isEdit.value ? '任务更新成功' : '任务创建成功')
      dialogVisible.value = false
      fetchTasks()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 切换激活状态
const toggleActive = async (task) => {
  try {
    const response = await adminStore.request.put(`/admin/task/${task._id}`, {
      isActive: task.isActive
    })
    
    if (response.code === 200) {
      ElMessage.success('状态更新成功')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    // 回滚状态
    task.isActive = !task.isActive
  }
}

// 删除任务
const deleteTask = async (task) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务"${task.title}"吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await adminStore.request.delete(`/admin/task/${task._id}`)
    
    if (response.code === 200) {
      ElMessage.success('任务删除成功')
      fetchTasks()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除任务失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 排序处理
const handleSortChange = ({ prop, order }) => {
  if (prop === 'order') {
    console.log('排序:', prop, order)
  }
}

// 获取类型文本
const getTypeText = (type) => {
  const types = {
    text: '文本题',
    number: '数字题',
    choice: '单选题',
    multiple: '多选题'
  }
  return types[type] || type
}

// 获取类型颜色
const getTypeColor = (type) => {
  const colors = {
    text: 'primary',
    number: 'success',
    choice: 'warning',
    multiple: 'danger'
  }
  return colors[type] || 'info'
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

onMounted(() => {
  fetchActivities()
  fetchAreas()
  fetchTasks()
})
</script>

<style scoped>
.admin-task {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.task-title {
  display: flex;
  align-items: center;
}

.area-info {
  display: flex;
  align-items: center;
}

.area-icon {
  margin-right: 8px;
  font-size: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.task-detail {
  padding: 20px 0;
}
</style>
