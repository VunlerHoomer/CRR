<template>
  <div class="activity-management">
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <h2>活动管理</h2>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          创建活动
        </el-button>
      </div>
    </el-card>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="活动类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" @change="fetchActivities">
            <el-option label="全部" value="all"></el-option>
            <el-option label="新活动" value="new"></el-option>
            <el-option label="旧活动" value="old"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="活动状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" @change="fetchActivities">
            <el-option label="全部" value="all"></el-option>
            <el-option label="即将开始" value="upcoming"></el-option>
            <el-option label="进行中" value="ongoing"></el-option>
            <el-option label="已结束" value="ended"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="搜索">
          <el-input 
            v-model="filterForm.search" 
            placeholder="搜索活动标题或描述"
            clearable
            @clear="fetchActivities"
            @keyup.enter="fetchActivities"
          >
            <template #append>
              <el-button :icon="Search" @click="fetchActivities"></el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 活动列表 -->
    <el-card class="table-card" shadow="never">
      <el-table 
        :data="activities" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="title" label="活动标题" width="200"></el-table-column>
        <el-table-column prop="description" label="活动描述" width="300" show-overflow-tooltip></el-table-column>
        
        <el-table-column label="活动类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'new' ? 'success' : 'info'" size="small">
              {{ row.type === 'new' ? '新活动' : '旧活动' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="活动状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)" 
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">
            {{ row.startDate ? formatDate(row.startDate) : '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="结束时间" width="180">
          <template #default="{ row }">
            {{ row.endDate ? formatDate(row.endDate) : '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.type === 'new' ? 'warning' : 'success'"
              @click="handleToggleType(row)"
            >
              {{ row.type === 'new' ? '设为旧活动' : '设为新活动' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchActivities"
          @current-change="fetchActivities"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '创建活动' : '编辑活动'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef"
        :model="formData" 
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="活动标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入活动标题"></el-input>
        </el-form-item>
        
        <el-form-item label="活动描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入活动描述"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="活动类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio label="new">新活动</el-radio>
            <el-radio label="old">旧活动</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="活动状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="upcoming">即将开始</el-radio>
            <el-radio label="ongoing">进行中</el-radio>
            <el-radio label="ended">已结束</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="formData.startDate"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          />
        </el-form-item>
        
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="formData.endDate"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          />
        </el-form-item>
        
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="formData.location" placeholder="请输入活动地点"></el-input>
        </el-form-item>
        
        <el-form-item label="最大人数" prop="maxParticipants">
          <el-input-number 
            v-model="formData.maxParticipants" 
            :min="1"
            placeholder="最少1人"
          />
        </el-form-item>
        
        <el-form-item label="报名截止时间" prop="registrationDeadline">
          <el-date-picker
            v-model="formData.registrationDeadline"
            type="datetime"
            placeholder="选择报名截止时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          />
        </el-form-item>
        
        <el-form-item label="活动难度">
          <el-radio-group v-model="formData.difficulty">
            <el-radio label="简单">简单</el-radio>
            <el-radio label="中等">中等</el-radio>
            <el-radio label="困难">困难</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="封面图片">
          <el-input v-model="formData.banner" placeholder="请输入封面图片URL"></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useAdminStore } from '@/store/admin'

const adminStore = useAdminStore()

// 数据状态
const activities = ref([])
const loading = ref(false)
const submitting = ref(false)

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

// 筛选表单
const filterForm = reactive({
  type: 'all',
  status: 'all',
  search: ''
})

// 对话框状态
const dialogVisible = ref(false)
const dialogMode = ref('create') // 'create' 或 'edit'
const formRef = ref(null)

// 表单数据
const formData = reactive({
  _id: '',
  title: '',
  description: '',
  type: 'new',
  status: 'upcoming',
  startDate: null,
  endDate: null,
  location: '',
  maxParticipants: 100,
  registrationDeadline: null,
  difficulty: '中等',
  requirements: [],
  rewards: [],
  banner: ''
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入活动标题', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择活动状态', trigger: 'change' }
  ]
}

// 获取活动列表
const fetchActivities = async () => {
  try {
    loading.value = true
    
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      type: filterForm.type !== 'all' ? filterForm.type : undefined,
      status: filterForm.status !== 'all' ? filterForm.status : undefined,
      search: filterForm.search || undefined
    }
    
    console.log('🔍 获取活动列表，参数:', params)
    
    const response = await adminStore.request.get('/admin/activity/list', { params })
    
    if (response.code === 200) {
      activities.value = response.data.activities
      pagination.total = response.data.pagination.total
      pagination.pages = response.data.pagination.pages
      console.log('✅ 活动列表获取成功:', activities.value.length)
    }
  } catch (error) {
    console.error('❌ 获取活动列表失败:', error)
    ElMessage.error('获取活动列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    upcoming: 'info',
    ongoing: 'success',
    ended: 'warning'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    upcoming: '即将开始',
    ongoing: '进行中',
    ended: '已结束'
  }
  return texts[status] || status
}

// 创建活动
const handleCreate = () => {
  dialogMode.value = 'create'
  
  // 重置表单
  Object.assign(formData, {
    _id: '',
    title: '',
    description: '',
    type: 'new',
    status: 'upcoming',
    startDate: null,
    endDate: null,
    location: '',
    maxParticipants: 100,
    registrationDeadline: null,
    difficulty: '中等',
    requirements: [],
    rewards: [],
    banner: ''
  })
  
  dialogVisible.value = true
}

// 编辑活动
const handleEdit = (activity) => {
  dialogMode.value = 'edit'
  
  // 填充表单数据
  Object.assign(formData, {
    _id: activity._id,
    title: activity.title,
    description: activity.description || '',
    type: activity.type,
    status: activity.status,
    startDate: activity.startDate,
    endDate: activity.endDate,
    location: activity.location || '',
    maxParticipants: activity.maxParticipants || 100,
    registrationDeadline: activity.registrationDeadline,
    difficulty: activity.difficulty || '中等',
    requirements: activity.requirements || [],
    rewards: activity.rewards || [],
    banner: activity.banner || ''
  })
  
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    // 验证表单
    if (!formRef.value) return
    await formRef.value.validate()
    
    submitting.value = true
    
    let response
    
    if (dialogMode.value === 'create') {
      // 创建活动
      console.log('🔄 创建活动:', formData)
      response = await adminStore.request.post('/admin/activity', formData)
    } else {
      // 更新活动
      console.log('🔄 更新活动:', formData)
      response = await adminStore.request.put(`/admin/activity/${formData._id}`, formData)
    }
    
    if (response.code === 200) {
      ElMessage.success(dialogMode.value === 'create' ? '创建成功' : '更新成功')
      dialogVisible.value = false
      await fetchActivities()
    }
  } catch (error) {
    console.error('❌ 操作失败:', error)
    if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('操作失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

// 切换活动类型
const handleToggleType = async (activity) => {
  try {
    const newType = activity.type === 'new' ? 'old' : 'new'
    const typeText = newType === 'new' ? '新活动' : '旧活动'
    
    await ElMessageBox.confirm(
      `确定要将"${activity.title}"设为${typeText}吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🔄 切换活动类型:', activity._id, newType)
    
    const response = await adminStore.request.patch(`/admin/activity/${activity._id}/type`, {
      type: newType
    })
    
    if (response.code === 200) {
      ElMessage.success('活动类型已更新')
      await fetchActivities()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 切换活动类型失败:', error)
      ElMessage.error('操作失败: ' + error.message)
    }
  }
}

// 删除活动
const handleDelete = async (activity) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除活动"${activity.title}"吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🔄 删除活动:', activity._id)
    
    const response = await adminStore.request.delete(`/admin/activity/${activity._id}`)
    
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await fetchActivities()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 删除活动失败:', error)
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// 页面加载时获取数据
onMounted(() => {
  if (!adminStore.isLoggedIn) {
    ElMessage.warning('请先登录管理员账号')
    return
  }
  
  fetchActivities()
})
</script>

<style scoped>
.activity-management {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  min-height: 400px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

