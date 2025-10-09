<template>
  <div class="admin-area">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>区域管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>
              新增区域
            </el-button>
            <el-button @click="fetchAreas">
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
              @change="fetchAreas" 
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
          <el-form-item label="关键词">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索区域名称或描述"
              @keyup.enter="fetchAreas"
              style="width: 200px"
            >
              <template #append>
                <el-button @click="fetchAreas">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 区域列表 -->
      <el-table 
        :data="areas" 
        v-loading="loading"
        row-key="_id"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="order" label="顺序" width="80" sortable="custom">
          <template #default="{ row }">
            <el-tag size="small">{{ row.order }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="区域名称" min-width="150">
          <template #default="{ row }">
            <div class="area-name">
              <span class="area-icon">{{ row.icon }}</span>
              <span>{{ row.name }}</span>
              <el-tag 
                :color="row.color" 
                size="small" 
                style="margin-left: 8px; color: white;"
              >
                {{ row.activity?.title }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="completionBonus" label="完成奖励" width="100">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.completionBonus }}分</el-tag>
          </template>
        </el-table-column>
        
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
            <el-button size="small" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteArea(row)"
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
          @size-change="fetchAreas"
          @current-change="fetchAreas"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑区域' : '新增区域'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="所属活动" prop="activity">
          <el-select v-model="form.activity" placeholder="请选择活动" style="width: 100%">
            <el-option
              v-for="activity in activities"
              :key="activity._id"
              :label="activity.title"
              :value="activity._id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="区域名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入区域名称" />
        </el-form-item>
        
        <el-form-item label="区域描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入区域描述"
          />
        </el-form-item>
        
        <el-form-item label="区域图标">
          <el-input v-model="form.icon" placeholder="请输入图标（如：📍）" />
        </el-form-item>
        
        <el-form-item label="区域颜色">
          <el-color-picker v-model="form.color" />
        </el-form-item>
        
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="form.order" :min="0" />
        </el-form-item>
        
        <el-form-item label="完成奖励" prop="completionBonus">
          <el-input-number v-model="form.completionBonus" :min="0" />
          <span style="margin-left: 8px; color: #999;">分</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Edit, Delete } from '@element-plus/icons-vue'
import { useAdminStore } from '@/store/admin'

const adminStore = useAdminStore()

// 数据
const areas = ref([])
const activities = ref([])
const loading = ref(false)
const submitting = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 筛选表单
const filterForm = ref({
  activityId: '',
  keyword: ''
})

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 表单数据
const form = ref({
  activity: '',
  name: '',
  description: '',
  icon: '📍',
  color: '#409eff',
  order: 0,
  completionBonus: 50,
  isActive: true
})

// 表单验证规则
const rules = {
  activity: [{ required: true, message: '请选择活动', trigger: 'change' }],
  name: [{ required: true, message: '请输入区域名称', trigger: 'blur' }],
  order: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  completionBonus: [{ required: true, message: '请输入完成奖励', trigger: 'blur' }]
}

// 获取区域列表
const fetchAreas = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filterForm.value
    }

    const response = await adminStore.request.get('/admin/area/list', { params })
    
    if (response.code === 200) {
      areas.value = response.data.areas
      total.value = response.data.pagination.total
    }
  } catch (error) {
    console.error('获取区域列表失败:', error)
    ElMessage.error('获取区域列表失败')
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

// 打开创建对话框
const openCreateDialog = () => {
  isEdit.value = false
  form.value = {
    activity: filterForm.value.activityId || '',
    name: '',
    description: '',
    icon: '📍',
    color: '#409eff',
    order: 0,
    completionBonus: 50,
    isActive: true
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (area) => {
  isEdit.value = true
  form.value = { ...area }
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    const url = isEdit.value ? `/admin/area/${form.value._id}` : '/admin/area'
    const method = isEdit.value ? 'put' : 'post'
    
    const response = await adminStore.request[method](url, form.value)
    
    if (response.code === 200) {
      ElMessage.success(isEdit.value ? '区域更新成功' : '区域创建成功')
      dialogVisible.value = false
      fetchAreas()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 切换激活状态
const toggleActive = async (area) => {
  try {
    const response = await adminStore.request.put(`/admin/area/${area._id}`, {
      isActive: area.isActive
    })
    
    if (response.code === 200) {
      ElMessage.success('状态更新成功')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    // 回滚状态
    area.isActive = !area.isActive
  }
}

// 删除区域
const deleteArea = async (area) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除区域"${area.name}"吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await adminStore.request.delete(`/admin/area/${area._id}`)
    
    if (response.code === 200) {
      ElMessage.success('区域删除成功')
      fetchAreas()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除区域失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 排序处理
const handleSortChange = ({ prop, order }) => {
  if (prop === 'order') {
    // 这里可以实现排序逻辑
    console.log('排序:', prop, order)
  }
}

onMounted(() => {
  fetchActivities()
  fetchAreas()
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

.area-name {
  display: flex;
  align-items: center;
}

.area-icon {
  margin-right: 8px;
  font-size: 16px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
