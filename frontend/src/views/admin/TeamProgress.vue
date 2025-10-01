<template>
  <div class="admin-team-progress">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>队伍任务进度</span>
          <div class="header-actions">
            <el-button @click="fetchTeamProgress">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计概览 -->
      <div class="stats-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="总队伍数" :value="overviewStats.totalTeams" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="活跃队伍" :value="overviewStats.activeTeams" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="平均完成率" :value="overviewStats.avgCompletionRate" suffix="%" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="总积分" :value="overviewStats.totalPoints" />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 队伍列表 -->
      <el-table
        :data="teams"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="name" label="队伍名称" width="150" />
        <el-table-column prop="leader" label="队长" width="120" />
        <el-table-column prop="memberCount" label="成员数" width="100" />
        <el-table-column prop="totalPoints" label="总积分" width="100" />
        <el-table-column prop="completedTasks" label="已完成" width="100" />
        <el-table-column prop="totalTasks" label="总任务" width="100" />
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
        <el-table-column prop="lastActivity" label="最后活动" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastActivity) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewTeamDetail(row)">详情</el-button>
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
        @size-change="fetchTeamProgress"
        @current-change="fetchTeamProgress"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 队伍详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="队伍详情" width="800px">
      <div v-if="currentTeam">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="队伍名称">{{ currentTeam.name }}</el-descriptions-item>
          <el-descriptions-item label="队长">{{ currentTeam.leader }}</el-descriptions-item>
          <el-descriptions-item label="成员数量">{{ currentTeam.memberCount }}</el-descriptions-item>
          <el-descriptions-item label="总积分">{{ currentTeam.totalPoints }}</el-descriptions-item>
          <el-descriptions-item label="已完成任务">{{ currentTeam.completedTasks }}</el-descriptions-item>
          <el-descriptions-item label="总任务数">{{ currentTeam.totalTasks }}</el-descriptions-item>
          <el-descriptions-item label="完成率">{{ currentTeam.completionRate }}%</el-descriptions-item>
          <el-descriptions-item label="最后活动">
            {{ formatDate(currentTeam.lastActivity) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/store/admin'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const adminStore = useAdminStore()

const loading = ref(false)
const detailDialogVisible = ref(false)

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const teams = ref([])
const currentTeam = ref(null)

const overviewStats = reactive({
  totalTeams: 0,
  activeTeams: 0,
  avgCompletionRate: 0,
  totalPoints: 0
})

// 获取队伍进度
const fetchTeamProgress = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }

    const response = await adminStore.request.get('/dashboard/teams', { params })
    if (response.code === 200) {
      teams.value = response.data.teams
      total.value = response.data.pagination.total
      
      // 计算概览统计
      calculateOverviewStats()
    }
  } catch (error) {
    ElMessage.error('获取队伍进度失败')
  } finally {
    loading.value = false
  }
}

// 计算概览统计
const calculateOverviewStats = () => {
  if (teams.value.length === 0) return

  overviewStats.totalTeams = teams.value.length
  overviewStats.activeTeams = teams.value.filter(team => team.completionRate > 0).length
  overviewStats.avgCompletionRate = Math.round(
    teams.value.reduce((sum, team) => sum + team.completionRate, 0) / teams.value.length
  )
  overviewStats.totalPoints = teams.value.reduce((sum, team) => sum + team.totalPoints, 0)
}

// 查看队伍详情
const viewTeamDetail = (team) => {
  currentTeam.value = team
  detailDialogVisible.value = true
}

// 工具函数
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchTeamProgress()
})
</script>

<style scoped>
.admin-team-progress {
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

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card .el-statistic {
  margin: 0;
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
  
  .stats-overview .el-col {
    margin-bottom: 15px;
  }
}
</style>
