<template>
  <div class="admin-area">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>区域管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            添加区域
          </el-button>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索区域名称或描述"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select v-model="selectedActivity" placeholder="选择活动" clearable @change="handleSearch">
              <el-option
                v-for="activity in activities"
                :key="activity._id"
                :label="activity.title"
                :value="activity._id"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 区域列表 -->
      <el-table
        :data="areas"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
      >
        <el-table-column prop="order" label="顺序" width="80" />
        <el-table-column label="图标" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.color, fontSize: '20px' }">{{ row.icon }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="区域名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="关联活动" min-width="150">
          <template #default="{ row }">
            <el-tag v-if="row.activity">{{ row.activity.title }}</el-tag>
            <span v-else class="text-muted">未关联</span>
          </template>
        </el-table-column>
        <el-table-column prop="completionBonus" label="完成奖励" width="100">
          <template #default="{ row }">
            <el-tag type="success">{{ row.completionBonus }}分</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.isActive"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" @click="viewDetails(row)">详情</el-button>
            <el-button type="primary" size="small" @click="editArea(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteArea(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '添加区域' : '编辑区域'"
      width="600px"
    >
      <el-form
        ref="areaFormRef"
        :model="areaForm"
        :rules="areaRules"
        label-width="100px"
      >
        <el-form-item label="关联活动" prop="activity">
          <el-select v-model="areaForm.activity" placeholder="请选择活动" style="width: 100%">
            <el-option
              v-for="activity in activities"
              :key="activity._id"
              :label="activity.title"
              :value="activity._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="区域名称" prop="name">
          <el-input v-model="areaForm.name" placeholder="请输入区域名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="areaForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入区域描述"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="显示顺序" prop="order">
              <el-input-number v-model="areaForm.order" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="完成奖励" prop="completionBonus">
              <el-input-number v-model="areaForm.completionBonus" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图标" prop="icon">
              <el-input v-model="areaForm.icon" placeholder="请输入图标" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="颜色" prop="color">
              <el-color-picker v-model="areaForm.color" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="areaForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ dialogMode === 'create' ? '创建' : '更新' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailsDialogVisible" title="区域详情" width="500px">
      <div v-if="currentArea">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="区域名称">{{ currentArea.name }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ currentArea.description || '无' }}</el-descriptions-item>
          <el-descriptions-item label="关联活动">
            <el-tag v-if="currentArea.activity">{{ currentArea.activity.title }}</el-tag>
            <span v-else>未关联</span>
          </el-descriptions-item>
          <el-descriptions-item label="显示顺序">{{ currentArea.order }}</el-descriptions-item>
          <el-descriptions-item label="完成奖励">{{ currentArea.completionBonus }}分</el-descriptions-item>
          <el-descriptions-item label="图标">
            <span :style="{ color: currentArea.color, fontSize: '20px' }">{{ currentArea.icon }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentArea.isActive ? 'success' : 'info'">
              {{ currentArea.isActive ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(currentArea.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(currentArea.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '@/store/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, View } from '@element-plus/icons-vue'

const adminStore = useAdminStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailsDialogVisible = ref(false)
const dialogMode = ref('create')
const currentArea = ref(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索
const searchKeyword = ref('')
const selectedActivity = ref('')

// 数据
const areas = ref([])
const activities = ref([])

// 表单
const areaFormRef = ref()
const areaForm = reactive({
  activity: '',
  name: '',
  description: '',
  order: 0,
  isActive: true,
  icon: '📍',
  color: '#409eff',
  completionBonus: 50
})

// 表单验证规则
const areaRules = {
  activity: [{ required: true, message: '请选择关联活动', trigger: 'change' }],
  name: [{ required: true, message: '请输入区域名称', trigger: 'blur' }],
  order: [{ required: true, message: '请输入显示顺序', trigger: 'blur' }],
  completionBonus: [{ required: true, message: '请输入完成奖励', trigger: 'blur' }]
}

// 方法
const loadAreas = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    if (selectedActivity.value) {
      params.activityId = selectedActivity.value
    }

    console.log('🔄 正在获取区域列表，参数:', params)
    const response = await adminStore.request.get('/admin/area/list', { params })

    if (response.code === 200) {
      areas.value = response.data.areas
      total.value = response.data.pagination.total
      console.log('✅ 区域列表加载成功:', response.data.areas.length, '个区域')
    } else {
      console.error('❌ 区域API返回错误:', response)
      ElMessage.error(response.message || '获取区域列表失败')
    }
  } catch (error) {
    console.error('❌ 获取区域列表失败:', error)
    if (error.response?.status === 401) {
      ElMessage.error('请先登录管理员账号')
    } else {
      ElMessage.error('获取区域列表失败: ' + (error.message || error))
    }
  } finally {
    loading.value = false
  }
}

const loadActivities = async () => {
  try {
    // 使用用户API获取活动列表，因为管理员需要查看所有活动
    const response = await adminStore.request.get('/activity/list', { params: { limit: 100 } })

    if (response.code === 200) {
      activities.value = response.data.activities
      console.log('✅ 活动列表加载成功:', response.data.activities.length, '个活动')
    } else {
      console.error('❌ 活动API返回错误:', response)
      ElMessage.error(response.message || '获取活动列表失败')
    }
  } catch (error) {
    console.error('❌ 获取活动列表失败:', error)
    ElMessage.error('获取活动列表失败: ' + (error.message || error))
  }
}

const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const editArea = (area) => {
  dialogMode.value = 'edit'
  Object.assign(areaForm, {
    activity: area.activity?._id || '',
    name: area.name,
    description: area.description,
    order: area.order,
    isActive: area.isActive,
    icon: area.icon,
    color: area.color,
    completionBonus: area.completionBonus
  })
  currentArea.value = area
  dialogVisible.value = true
}

const viewDetails = (area) => {
  currentArea.value = area
  detailsDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!areaFormRef.value) return
  
  try {
    await areaFormRef.value.validate()
    submitting.value = true

    let response
    if (dialogMode.value === 'create') {
      response = await adminStore.request.post('/admin/area', areaForm)
    } else {
      response = await adminStore.request.put(`/admin/area/${currentArea.value._id}`, areaForm)
    }

    if (response.code === 200) {
      ElMessage.success(dialogMode.value === 'create' ? '区域创建成功' : '区域更新成功')
      dialogVisible.value = false
      loadAreas()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteArea = async (area) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除区域 "${area.name}" 吗？删除后无法恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await adminStore.request.delete(`/admin/area/${area._id}`)

    if (response.code === 200) {
      ElMessage.success('区域删除成功')
      loadAreas()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleStatusChange = async (area) => {
  try {
    const response = await adminStore.request.put(`/admin/area/${area._id}`, { isActive: area.isActive })

    if (response.code === 200) {
      ElMessage.success('状态更新成功')
    } else {
      ElMessage.error(response.message || '状态更新失败')
      // 恢复原状态
      area.isActive = !area.isActive
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    area.isActive = !area.isActive
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadAreas()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadAreas()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadAreas()
}

const resetForm = () => {
  Object.assign(areaForm, {
    activity: '',
    name: '',
    description: '',
    order: 0,
    isActive: true,
    icon: '📍',
    color: '#409eff',
    completionBonus: 50
  })
  currentArea.value = null
  if (areaFormRef.value) {
    areaFormRef.value.clearValidate()
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  // 检查管理员登录状态
  if (!adminStore.isLoggedIn) {
    console.warn('⚠️ 管理员未登录，重定向到登录页面')
    ElMessage.warning('请先登录管理员账号')
    // 可以在这里重定向到登录页面
    // router.push('/admin/login')
    return
  }
  
  console.log('✅ 管理员已登录:', adminStore.admin?.username)
  loadActivities()
  loadAreas()
})
</script>

<style scoped>
.admin-area {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.text-muted {
  color: #909399;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>