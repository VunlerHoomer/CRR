<template>
  <div class="registration-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>报名管理</h2>
          <el-button type="primary" @click="fetchRegistrations">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-form :inline="true">
          <el-form-item label="活动">
            <el-select v-model="filterForm.activityId" placeholder="选择活动" clearable style="width: 200px">
              <el-option 
                v-for="activity in activities" 
                :key="activity._id" 
                :label="activity.title" 
                :value="activity._id" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="选择状态" clearable style="width: 150px">
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input 
              v-model="filterForm.keyword" 
              placeholder="姓名/手机号" 
              clearable 
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchRegistrations">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedRegistrations.length > 0">
        <el-button type="success" @click="batchReview('approved')">
          批量通过 ({{ selectedRegistrations.length }})
        </el-button>
        <el-button type="danger" @click="batchReview('rejected')">
          批量拒绝 ({{ selectedRegistrations.length }})
        </el-button>
      </div>

      <!-- 报名列表 -->
      <el-table 
        :data="registrations" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="registrationInfo.realName" label="姓名" width="100" />
        <el-table-column prop="registrationInfo.phone" label="手机号" width="120" />
        <el-table-column prop="user.username" label="用户名" width="120" />
        <el-table-column prop="registrationInfo.school" label="学校" width="150" />
        <el-table-column prop="registrationInfo.gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.registrationInfo.gender === 'male' ? '男' : row.registrationInfo.gender === 'female' ? '女' : '其他' }}
          </template>
        </el-table-column>
        <el-table-column prop="activity.title" label="活动" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="canAccessTaskManagement" label="任务权限" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.canAccessTaskManagement"
              @change="updateTaskPermission(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="registeredAt" label="报名时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.registeredAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button 
              v-if="row.status === 'pending'" 
              size="small" 
              type="success"
              @click="reviewRegistration(row, 'approved')"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.status === 'pending'" 
              size="small" 
              type="danger"
              @click="reviewRegistration(row, 'rejected')"
            >
              拒绝
            </el-button>
            <el-button 
              v-if="row.status === 'approved' && !row.checkInStatus.isCheckedIn" 
              size="small" 
              type="warning"
              @click="checkIn(row)"
            >
              签到
            </el-button>
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
        @size-change="fetchRegistrations"
        @current-change="fetchRegistrations"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="报名详情" width="600px">
      <div v-if="currentRegistration">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="真实姓名">{{ currentRegistration.registrationInfo?.realName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentRegistration.registrationInfo?.phone }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentRegistration.user?.username }}</el-descriptions-item>
          <el-descriptions-item label="学校">{{ currentRegistration.registrationInfo?.school }}</el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ currentRegistration.registrationInfo?.gender === 'male' ? '男' : currentRegistration.registrationInfo?.gender === 'female' ? '女' : '其他' }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentRegistration.registrationInfo?.email || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="活动" :span="2">{{ currentRegistration.activity?.title }}</el-descriptions-item>
          <el-descriptions-item label="报名时间" :span="2">{{ formatDate(currentRegistration.registeredAt) }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="getStatusType(currentRegistration.status)">
              {{ getStatusText(currentRegistration.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任务权限">
            <el-tag :type="currentRegistration.canAccessTaskManagement ? 'success' : 'info'">
              {{ currentRegistration.canAccessTaskManagement ? '有权限' : '无权限' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="签到状态">
            <el-tag :type="currentRegistration.checkInStatus?.isCheckedIn ? 'success' : 'info'">
              {{ currentRegistration.checkInStatus?.isCheckedIn ? '已签到' : '未签到' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="签到时间">
            {{ currentRegistration.checkInStatus?.checkInTime ? formatDate(currentRegistration.checkInStatus.checkInTime) : '未签到' }}
          </el-descriptions-item>
          <el-descriptions-item label="审核人">{{ currentRegistration.reviewedBy?.username || '未审核' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">
            {{ currentRegistration.reviewedAt ? formatDate(currentRegistration.reviewedAt) : '未审核' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentRegistration.registrationInfo?.note || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="审核备注" :span="2">
            {{ currentRegistration.reviewNote || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { useAdminStore } from '@/store/admin'

const adminStore = useAdminStore()

const loading = ref(false)
const registrations = ref([])
const activities = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedRegistrations = ref([])
const detailDialogVisible = ref(false)
const currentRegistration = ref(null)

const filterForm = ref({
  activityId: '',
  status: '',
  keyword: ''
})

// 获取报名列表
const fetchRegistrations = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filterForm.value
    }

    console.log('📋 获取报名列表:', params)

    const response = await adminStore.request.get('/admin/registration/list', { params })
    console.log('📊 报名列表响应:', response)
    
    if (response.code === 200) {
      registrations.value = response.data.registrations
      total.value = response.data.pagination.total
      console.log(`✅ 获取到 ${registrations.value.length} 条报名记录，总计 ${total.value} 条`)
    }
  } catch (error) {
    console.error('❌ 获取报名列表失败:', error)
    
    let errorMessage = '获取报名列表失败'
    if (error.response?.status === 401) {
      errorMessage = '管理员权限已过期，请重新登录'
      adminStore.logout()
    } else if (error.response?.status === 403) {
      errorMessage = '没有权限访问报名管理'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }
    
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 获取活动列表
const fetchActivities = async () => {
  try {
    console.log('📋 获取活动列表...')
    
    // 使用管理员专用的活动API
    const response = await adminStore.request.get('/admin/activity/list', {
      params: { limit: 100 }
    })
    
    console.log('📊 活动列表响应:', response)
    
    if (response.code === 200) {
      activities.value = response.data.activities || []
      console.log(`✅ 获取到 ${activities.value.length} 个活动`)
    } else {
      console.error('❌ 活动列表API返回错误:', response.message)
      activities.value = []
    }
  } catch (error) {
    console.error('❌ 获取活动列表失败:', error)
    
    let errorMessage = '获取活动列表失败'
    if (error.response?.status === 401) {
      errorMessage = '管理员权限已过期，请重新登录'
      adminStore.logout()
    } else if (error.response?.status === 403) {
      errorMessage = '没有权限访问活动列表'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }
    
    console.error('详细错误:', errorMessage)
    activities.value = []
  }
}

// 审核报名
const reviewRegistration = async (registration, status) => {
  try {
    const { value: note } = await ElMessageBox.prompt(
      '请输入审核备注（可选）',
      status === 'approved' ? '通过审核' : '拒绝审核',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea'
      }
    ).catch(() => ({ value: '' }))

    const response = await adminStore.request.put(`/admin/registration/${registration._id}/review`, {
      status,
      note: note || ''
    })

    if (response.code === 200) {
      ElMessage.success('审核成功')
      fetchRegistrations()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '审核失败')
    }
  }
}

// 批量审核
const batchReview = async (status) => {
  try {
    const { value: note } = await ElMessageBox.prompt(
      '请输入审核备注（可选）',
      `批量${status === 'approved' ? '通过' : '拒绝'}审核`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea'
      }
    ).catch(() => ({ value: '' }))

    const ids = selectedRegistrations.value.map(r => r._id)

    const response = await adminStore.request.put('/admin/registration/batch-review', {
      ids,
      status,
      note: note || ''
    })

    if (response.code === 200) {
      ElMessage.success('批量审核成功')
      selectedRegistrations.value = []
      fetchRegistrations()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量审核失败')
    }
  }
}

// 更新任务权限
const updateTaskPermission = async (registration) => {
  try {
    const response = await adminStore.request.put(
      `/admin/registration/${registration._id}/task-permission`,
      { canAccessTaskManagement: registration.canAccessTaskManagement }
    )

    if (response.code === 200) {
      ElMessage.success('权限更新成功')
    }
  } catch (error) {
    ElMessage.error('权限更新失败')
    registration.canAccessTaskManagement = !registration.canAccessTaskManagement
  }
}

// 签到
const checkIn = async (registration) => {
  try {
    await ElMessageBox.confirm('确认签到吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await adminStore.request.put(`/admin/registration/${registration._id}/check-in`)

    if (response.code === 200) {
      ElMessage.success('签到成功')
      fetchRegistrations()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('签到失败')
    }
  }
}

// 查看详情
const viewDetail = async (registration) => {
  try {
    const response = await adminStore.request.get(`/admin/registration/${registration._id}`)
    if (response.code === 200) {
      currentRegistration.value = response.data.registration
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败')
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRegistrations.value = selection
}

// 状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

// 状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消'
  }
  return texts[status] || '未知'
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchRegistrations()
  fetchActivities()
  
  // 每30秒自动刷新一次报名列表
  const refreshInterval = setInterval(() => {
    if (!loading.value) {
      console.log('🔄 自动刷新报名列表...')
      fetchRegistrations()
    }
  }, 30000)
  
  // 组件卸载时清理定时器
  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
})
</script>

<style scoped>
.registration-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.batch-actions {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>

