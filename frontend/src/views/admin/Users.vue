<template>
  <div class="admin-users">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索手机号或昵称"
            style="width: 300px"
            clearable
            @clear="fetchUsers"
            @keyup.enter="fetchUsers"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="fetchUsers">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </template>

      <el-table
        :data="users"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column prop="school" label="学校" width="180" />
        <el-table-column prop="gender" label="性别" width="100">
          <template #default="{ row }">{{ genderText(row.gender) }}</template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100" sortable />
        <el-table-column prop="level" label="等级" width="80" sortable />
        <el-table-column prop="totalQuizCount" label="答题数" width="100" />
        <el-table-column prop="correctQuizCount" label="正确数" width="100" />
        <el-table-column prop="accuracy" label="正确率" width="100">
          <template #default="{ row }">
            {{ row.accuracy || 0 }}%
          </template>
        </el-table-column>
        <el-table-column prop="totalLotteryCount" label="抽签数" width="100" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" @click="viewUserDetail(row)">详情</el-button>
            <el-button type="primary" size="small" @click="editUser(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchUsers"
        @current-change="fetchUsers"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="用户详情" width="800px">
      <div v-if="currentUser">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="手机号">{{ currentUser.user?.phone }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentUser.user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ currentUser.user?.points }}</el-descriptions-item>
          <el-descriptions-item label="等级">{{ currentUser.user?.level }}</el-descriptions-item>
          <el-descriptions-item label="答题总数">{{ currentUser.user?.totalQuizCount }}</el-descriptions-item>
          <el-descriptions-item label="答对数">{{ currentUser.user?.correctQuizCount }}</el-descriptions-item>
          <el-descriptions-item label="正确率">{{ currentUser.user?.accuracy }}%</el-descriptions-item>
          <el-descriptions-item label="抽签总数">{{ currentUser.user?.totalLotteryCount }}</el-descriptions-item>
          <el-descriptions-item label="学校">{{ currentUser.user?.school }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ genderText(currentUser.user?.gender) }}</el-descriptions-item>
          <el-descriptions-item label="注册时间" :span="2">
            {{ formatDate(currentUser.user?.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-tabs v-model="activeTab" style="margin-top: 20px">
          <el-tab-pane label="答题记录" name="quiz">
            <el-table :data="currentUser.quizRecords || []" max-height="300">
              <el-table-column prop="quizId.question" label="题目" show-overflow-tooltip />
              <el-table-column prop="isCorrect" label="结果" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.isCorrect ? 'success' : 'danger'" size="small">
                    {{ row.isCorrect ? '正确' : '错误' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="score" label="得分" width="80" />
              <el-table-column prop="createdAt" label="时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="抽签记录" name="lottery">
            <el-table :data="currentUser.lotteryRecords || []" max-height="300">
              <el-table-column prop="lotteryId.title" label="活动" />
              <el-table-column prop="result.item" label="结果" />
              <el-table-column prop="points" label="积分" width="80" />
              <el-table-column prop="createdAt" label="时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户" width="500px">
      <el-form
        ref="editFormRef"
        :model="editForm"
        label-width="100px"
      >
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="学校">
          <el-input v-model="editForm.school" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editForm.gender" style="width:100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分">
          <el-input-number v-model="editForm.points" :min="0" />
        </el-form-item>
        <el-form-item label="等级">
          <el-input-number v-model="editForm.level" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.isActive" active-text="正常" inactive-text="禁用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/store/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const adminStore = useAdminStore()

const loading = ref(false)
const submitting = ref(false)
const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)
const activeTab = ref('quiz')

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const users = ref([])
const currentUser = ref(null)

const editFormRef = ref()
const editForm = reactive({
  _id: '',
  nickname: '',
  phone: '',
  school: '',
  gender: '',
  points: 0,
  level: 1,
  isActive: true
})

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value

    const response = await adminStore.request.get('/admin/users/list', { params })
    if (response.data.code === 200) {
      users.value = response.data.data.users
      total.value = response.data.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const viewUserDetail = async (user) => {
  try {
    const response = await adminStore.request.get(`/admin/users/${user._id}`)
    if (response.data.code === 200) {
      currentUser.value = response.data.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取用户详情失败')
  }
}

const editUser = (user) => {
  Object.assign(editForm, {
    _id: user._id,
    nickname: user.nickname,
    phone: user.phone,
    school: user.school,
    gender: user.gender,
    points: user.points,
    level: user.level,
    isActive: user.isActive
  })
  editDialogVisible.value = true
}

const submitEdit = async () => {
  try {
    submitting.value = true
    const payload = { ...editForm }
    const response = await adminStore.request.put(`/admin/users/${editForm._id}`, payload)
    
    if (response.data.code === 200) {
      ElMessage.success('用户信息更新成功')
      editDialogVisible.value = false
      fetchUsers()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

const deleteUser = (user) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${user.nickname}" 吗？删除后将无法恢复！`,
    '警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await adminStore.request.delete(`/admin/users/${user._id}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchUsers()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const genderText = (g) => {
  if (g === 'male') return '男'
  if (g === 'female') return '女'
  if (g === 'other') return '其他'
  return ''
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.admin-users {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
