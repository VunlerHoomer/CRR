<template>
  <div class="admin-quiz">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>题目管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            添加题目
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索题目或标签"
          style="width: 300px"
          clearable
          @clear="fetchQuizzes"
          @keyup.enter="fetchQuizzes"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="filterCategory" placeholder="分类" clearable @change="fetchQuizzes" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="通用" value="general" />
          <el-option label="技术" value="technology" />
          <el-option label="科学" value="science" />
          <el-option label="历史" value="history" />
          <el-option label="其他" value="other" />
        </el-select>

        <el-select v-model="filterDifficulty" placeholder="难度" clearable @change="fetchQuizzes" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="简单" value="easy" />
          <el-option label="中等" value="medium" />
          <el-option label="困难" value="hard" />
        </el-select>

        <el-button type="primary" @click="fetchQuizzes">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <el-table
        :data="quizzes"
        v-loading="loading"
        style="width: 100%; margin-top: 20px"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="question" label="题目" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getCategoryText(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.difficulty)" size="small">
              {{ getDifficultyText(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="correctAnswer" label="正确答案" width="120" show-overflow-tooltip />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editQuiz(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteQuiz(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchQuizzes"
        @current-change="fetchQuizzes"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '添加题目' : '编辑题目'"
      width="600px"
    >
      <el-form
        ref="quizFormRef"
        :model="quizForm"
        :rules="quizRules"
        label-width="100px"
      >
        <el-form-item label="题目" prop="question">
          <el-input v-model="quizForm.question" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="选项" prop="options">
          <div v-for="(option, index) in quizForm.options" :key="index" style="display: flex; gap: 8px; margin-bottom: 8px">
            <el-input v-model="quizForm.options[index]" :placeholder="`选项 ${index + 1}`" />
            <el-button v-if="quizForm.options.length > 2" type="danger" @click="removeOption(index)">删除</el-button>
          </div>
          <el-button @click="addOption" style="width: 100%">添加选项</el-button>
        </el-form-item>

        <el-form-item label="正确答案" prop="correctAnswer">
          <el-select v-model="quizForm.correctAnswer" placeholder="选择正确答案" style="width: 100%">
            <el-option v-for="option in quizForm.options" :key="option" :label="option" :value="option" />
          </el-select>
        </el-form-item>

        <el-form-item label="解析" prop="explanation">
          <el-input v-model="quizForm.explanation" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select v-model="quizForm.category" placeholder="选择分类" style="width: 100%">
            <el-option label="通用" value="general" />
            <el-option label="技术" value="technology" />
            <el-option label="科学" value="science" />
            <el-option label="历史" value="history" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="quizForm.difficulty" placeholder="选择难度" style="width: 100%">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select v-model="quizForm.tags" multiple placeholder="添加标签" style="width: 100%" allow-create filterable>
            <el-option label="编程" value="编程" />
            <el-option label="算法" value="算法" />
            <el-option label="数据库" value="数据库" />
            <el-option label="前端" value="前端" />
            <el-option label="后端" value="后端" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="quizForm.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuiz" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/store/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, User, Present, TrendCharts } from '@element-plus/icons-vue'

const adminStore = useAdminStore()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref('create')

const searchKeyword = ref('')
const filterCategory = ref('')
const filterDifficulty = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const quizzes = ref([])
const stats = ref({})

const quizFormRef = ref()
const quizForm = reactive({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  explanation: '',
  category: 'general',
  difficulty: 'medium',
  tags: [],
  isActive: true
})

const quizRules = {
  question: [{ required: true, message: '请输入题目', trigger: 'blur' }],
  correctAnswer: [{ required: true, message: '请选择正确答案', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
}

// 获取题目列表
const fetchQuizzes = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterCategory.value) params.category = filterCategory.value
    if (filterDifficulty.value) params.difficulty = filterDifficulty.value

    const response = await adminStore.request.get('/admin/quiz/list', { params })
    if (response.data.code === 200) {
      quizzes.value = response.data.data.quizzes
      total.value = response.data.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('获取题目列表失败')
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const editQuiz = (quiz) => {
  dialogMode.value = 'edit'
  Object.assign(quizForm, {
    _id: quiz._id,
    question: quiz.question,
    options: [...quiz.options],
    correctAnswer: quiz.correctAnswer,
    explanation: quiz.explanation || '',
    category: quiz.category,
    difficulty: quiz.difficulty,
    tags: quiz.tags || [],
    isActive: quiz.isActive
  })
  dialogVisible.value = true
}

const submitQuiz = async () => {
  if (!quizFormRef.value) return

  try {
    await quizFormRef.value.validate()
    submitting.value = true

    const url = dialogMode.value === 'create' ? '/quiz/create' : `/quiz/${quizForm._id}`
    const method = dialogMode.value === 'create' ? 'post' : 'put'

    const response = await adminStore.request[method](url, quizForm)
    
    if (response.data.code === 200) {
      ElMessage.success(dialogMode.value === 'create' ? '题目创建成功' : '题目更新成功')
      dialogVisible.value = false
      fetchQuizzes()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteQuiz = (quiz) => {
  ElMessageBox.confirm('确定要删除这个题目吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await adminStore.request.delete(`/admin/quiz/${quiz._id}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchQuizzes()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const addOption = () => {
  quizForm.options.push('')
}

const removeOption = (index) => {
  quizForm.options.splice(index, 1)
}

const resetForm = () => {
  Object.assign(quizForm, {
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    category: 'general',
    difficulty: 'medium',
    tags: [],
    isActive: true
  })
}

const getCategoryText = (category) => {
  const map = {
    general: '通用',
    technology: '技术',
    science: '科学',
    history: '历史',
    other: '其他'
  }
  return map[category] || category
}

const getDifficultyText = (difficulty) => {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty] || difficulty
}

const getDifficultyType = (difficulty) => {
  const map = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return map[difficulty] || 'info'
}

onMounted(() => {
  fetchQuizzes()
})
</script>

<style scoped>
.admin-quiz {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
</style>
