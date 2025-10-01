<template>
  <div class="admin-lottery">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>抽签管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            添加抽签活动
          </el-button>
        </div>
      </template>

      <el-table
        :data="lotteries"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="title" label="活动名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)" size="small">
              {{ getCategoryText(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxDraws" label="每日次数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '进行中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" @click="viewStats(row)">统计</el-button>
            <el-button type="primary" size="small" @click="editLottery(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteLottery(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchLotteries"
        @current-change="fetchLotteries"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '添加抽签活动' : '编辑抽签活动'"
      width="700px"
    >
      <el-form
        ref="lotteryFormRef"
        :model="lotteryForm"
        :rules="lotteryRules"
        label-width="120px"
      >
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="lotteryForm.title" placeholder="如：每日幸运抽签" />
        </el-form-item>

        <el-form-item label="活动描述" prop="description">
          <el-input v-model="lotteryForm.description" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select v-model="lotteryForm.category" style="width: 100%">
            <el-option label="每日" value="daily" />
            <el-option label="周末" value="weekly" />
            <el-option label="特别" value="special" />
            <el-option label="活动" value="event" />
          </el-select>
        </el-form-item>

        <el-form-item label="奖品列表" prop="items">
          <div v-for="(item, index) in lotteryForm.items" :key="index" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center">
            <el-input v-model="lotteryForm.items[index]" :placeholder="`奖品 ${index + 1}`" style="flex: 1" />
            <el-input-number
              v-model="lotteryForm.probabilities[index]"
              :min="0"
              :max="100"
              :precision="2"
              placeholder="概率%"
              style="width: 120px"
            />
            <el-button v-if="lotteryForm.items.length > 2" type="danger" @click="removeItem(index)">删除</el-button>
          </div>
          <el-button @click="addItem" style="width: 100%">添加奖品</el-button>
          <div style="margin-top: 8px; color: #909399; font-size: 12px">
            概率总和: {{ totalProbability }}% (必须等于100%)
          </div>
        </el-form-item>

        <el-form-item label="每日次数" prop="maxDraws">
          <el-input-number v-model="lotteryForm.maxDraws" :min="1" :max="10" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="lotteryForm.status" style="width: 100%">
            <el-option label="进行中" value="active" />
            <el-option label="已结束" value="ended" />
            <el-option label="未开始" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitLottery" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 统计对话框 -->
    <el-dialog v-model="statsDialogVisible" title="抽签统计" width="600px">
      <div v-if="currentStats">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="活动名称">{{ currentStats.lottery?.title }}</el-descriptions-item>
          <el-descriptions-item label="总抽签次数">{{ currentStats.totalDraws }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px">奖品分布</h4>
        <el-table :data="statsTableData" style="width: 100%">
          <el-table-column prop="item" label="奖品" />
          <el-table-column prop="count" label="抽中次数" />
          <el-table-column prop="rate" label="实际概率" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '@/store/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, User, Present, TrendCharts } from '@element-plus/icons-vue'

const adminStore = useAdminStore()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const statsDialogVisible = ref(false)
const dialogMode = ref('create')

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const lotteries = ref([])
const currentStats = ref(null)

const lotteryFormRef = ref()
const lotteryForm = reactive({
  title: '',
  description: '',
  category: 'daily',
  items: ['谢谢参与', ''],
  probabilities: [50, 50],
  maxDraws: 1,
  status: 'active'
})

const lotteryRules = {
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  maxDraws: [{ required: true, message: '请设置每日次数', trigger: 'blur' }]
}

const totalProbability = computed(() => {
  return lotteryForm.probabilities.reduce((sum, prob) => sum + (prob || 0), 0).toFixed(2)
})

const statsTableData = computed(() => {
  if (!currentStats.value) return []
  
  const { itemStats, totalDraws, lottery } = currentStats.value
  return lottery.items.map((item, index) => ({
    item,
    count: itemStats[item] || 0,
    rate: totalDraws > 0 
      ? ((itemStats[item] || 0) / totalDraws * 100).toFixed(2) + '%'
      : '0%'
  }))
})

// 获取抽签列表
const fetchLotteries = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }

    const response = await adminStore.request.get('/lottery/list', { params })
    if (response.data.code === 200) {
      lotteries.value = response.data.data.lotteries
      total.value = response.data.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('获取抽签列表失败')
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const editLottery = (lottery) => {
  dialogMode.value = 'edit'
  Object.assign(lotteryForm, {
    _id: lottery._id,
    title: lottery.title,
    description: lottery.description || '',
    category: lottery.category,
    items: [...lottery.items],
    probabilities: [...lottery.probabilities],
    maxDraws: lottery.maxDraws,
    status: lottery.status
  })
  dialogVisible.value = true
}

const submitLottery = async () => {
  if (!lotteryFormRef.value) return

  // 验证概率总和
  if (Math.abs(parseFloat(totalProbability.value) - 100) > 0.01) {
    ElMessage.error('概率总和必须等于100%')
    return
  }

  try {
    await lotteryFormRef.value.validate()
    submitting.value = true

    const url = dialogMode.value === 'create' ? '/lottery/create' : `/lottery/${lotteryForm._id}`
    const method = dialogMode.value === 'create' ? 'post' : 'put'

    const response = await adminStore.request[method](url, lotteryForm)
    
    if (response.data.code === 200) {
      ElMessage.success(dialogMode.value === 'create' ? '抽签活动创建成功' : '抽签活动更新成功')
      dialogVisible.value = false
      fetchLotteries()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteLottery = (lottery) => {
  ElMessageBox.confirm('确定要删除这个抽签活动吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await adminStore.request.delete(`/lottery/${lottery._id}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchLotteries()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const viewStats = async (lottery) => {
  try {
    const response = await adminStore.request.get(`/lottery/${lottery._id}/stats`)
    if (response.data.code === 200) {
      currentStats.value = response.data.data
      statsDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

const addItem = () => {
  lotteryForm.items.push('')
  lotteryForm.probabilities.push(0)
}

const removeItem = (index) => {
  lotteryForm.items.splice(index, 1)
  lotteryForm.probabilities.splice(index, 1)
}

const resetForm = () => {
  Object.assign(lotteryForm, {
    title: '',
    description: '',
    category: 'daily',
    items: ['谢谢参与', ''],
    probabilities: [50, 50],
    maxDraws: 1,
    status: 'active'
  })
}

const getCategoryText = (category) => {
  const map = {
    daily: '每日',
    weekly: '周末',
    special: '特别',
    event: '活动'
  }
  return map[category] || category
}

const getCategoryType = (category) => {
  const map = {
    daily: 'success',
    weekly: 'warning',
    special: 'danger',
    event: 'primary'
  }
  return map[category] || 'info'
}

onMounted(() => {
  fetchLotteries()
})
</script>

<style scoped>
.admin-lottery {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
