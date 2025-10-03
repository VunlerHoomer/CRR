<template>
  <div class="admin-dashboard">
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon user-icon">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">总用户数</div>
            <div class="stat-value">{{ stats.users?.total || 0 }}</div>
            <div class="stat-desc">今日新增: {{ stats.users?.todayNew || 0 }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon quiz-icon">
            <el-icon :size="32"><Edit /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">题目总数</div>
            <div class="stat-value">{{ stats.quizzes?.total || 0 }}</div>
            <div class="stat-desc">今日答题: {{ stats.quizzes?.todayRecords || 0 }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon lottery-icon">
            <el-icon :size="32"><Present /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">抽签活动</div>
            <div class="stat-value">{{ stats.lotteries?.active || 0 }}</div>
            <div class="stat-desc">今日抽签: {{ stats.lotteries?.todayRecords || 0 }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon active-icon">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">活跃用户</div>
            <div class="stat-value">{{ stats.users?.active || 0 }}</div>
            <div class="stat-desc">近7日答题: {{ stats.quizzes?.weeklyRecords || 0 }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon task-icon">
            <el-icon :size="32"><List /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">任务总数</div>
            <div class="stat-value">{{ stats.tasks?.total || 0 }}</div>
            <div class="stat-desc">完成率: {{ stats.tasks?.completionRate || 0 }}%</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon team-icon">
            <el-icon :size="32"><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">队伍数量</div>
            <div class="stat-value">{{ stats.teams?.total || 0 }}</div>
            <div class="stat-desc">平均积分: {{ stats.teams?.avgPoints || 0 }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/admin/quiz')">
              <el-icon><Edit /></el-icon>
              <span>管理题目</span>
            </el-button>
            <el-button type="success" @click="$router.push('/admin/lottery')">
              <el-icon><Present /></el-icon>
              <span>管理抽签</span>
            </el-button>
            <el-button type="warning" @click="$router.push('/admin/users')">
              <el-icon><User /></el-icon>
              <span>管理用户</span>
            </el-button>
            <el-button type="info" @click="$router.push('/admin/tasks')">
              <el-icon><List /></el-icon>
              <span>任务管理</span>
            </el-button>
            <el-button type="success" @click="$router.push('/admin/team-progress')">
              <el-icon><Trophy /></el-icon>
              <span>队伍进度</span>
            </el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              <span>刷新数据</span>
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/store/admin'
import { ElMessage } from 'element-plus'
import { User, Edit, Present, TrendCharts, Refresh } from '@element-plus/icons-vue'

const adminStore = useAdminStore()
const stats = ref({})

const fetchStats = async () => {
  try {
    const response = await adminStore.request.get('/admin/dashboard/overview')
    console.log('仪表盘响应:', response)
    if (response.data.code === 200) {
      stats.value = response.data.data
      console.log('统计数据:', stats.value)
    } else {
      ElMessage.error(response.data.message || '获取统计数据失败')
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error(error.response?.data?.message || '获取统计数据失败')
  }
}

const refreshData = () => {
  fetchStats()
  ElMessage.success('数据已刷新')
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.admin-dashboard {
  width: 100%;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.task-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.team-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}

.quiz-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.lottery-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.active-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-desc {
  font-size: 12px;
  color: #c0c4cc;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
