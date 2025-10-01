<template>
  <div class="ranking-page">
    <div class="ranking-container">
      <div class="ranking-header">
        <h2>排行榜</h2>
        <p>看看谁是最强的答题高手</p>
      </div>

      <div class="ranking-tabs">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="积分榜" name="points">
            <div class="ranking-content">
              <div class="ranking-list">
                <div 
                  v-for="(user, index) in rankingData" 
                  :key="user.id"
                  class="ranking-item"
                  :class="{ 'top-three': index < 3 }"
                >
                  <div class="rank-number">
                    <span v-if="index < 3" class="medal">
                      <el-icon :size="24">
                        <component :is="getMedalIcon(index)" />
                      </el-icon>
                    </span>
                    <span v-else class="rank">{{ index + 1 }}</span>
                  </div>
                  
                  <div class="user-info">
                    <el-avatar :size="40" :src="user.avatar">
                      {{ user.nickname?.charAt(0) }}
                    </el-avatar>
                    <div class="user-details">
                      <h4>{{ user.nickname }}</h4>
                      <p>等级 {{ user.level }}</p>
                    </div>
                  </div>
                  
                  <div class="user-stats">
                    <div class="stat-item">
                      <span class="stat-value">{{ user.points }}</span>
                      <span class="stat-label">积分</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ user.accuracy }}%</span>
                      <span class="stat-label">准确率</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="准确率榜" name="accuracy">
            <div class="ranking-content">
              <div class="ranking-list">
                <div 
                  v-for="(user, index) in accuracyRanking" 
                  :key="user.id"
                  class="ranking-item"
                  :class="{ 'top-three': index < 3 }"
                >
                  <div class="rank-number">
                    <span v-if="index < 3" class="medal">
                      <el-icon :size="24">
                        <component :is="getMedalIcon(index)" />
                      </el-icon>
                    </span>
                    <span v-else class="rank">{{ index + 1 }}</span>
                  </div>
                  
                  <div class="user-info">
                    <el-avatar :size="40" :src="user.avatar">
                      {{ user.nickname?.charAt(0) }}
                    </el-avatar>
                    <div class="user-details">
                      <h4>{{ user.nickname }}</h4>
                      <p>等级 {{ user.level }}</p>
                    </div>
                  </div>
                  
                  <div class="user-stats">
                    <div class="stat-item">
                      <span class="stat-value">{{ user.accuracy }}%</span>
                      <span class="stat-label">准确率</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ user.totalQuizCount }}</span>
                      <span class="stat-label">答题数</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="答题榜" name="quiz">
            <div class="ranking-content">
              <div class="ranking-list">
                <div 
                  v-for="(user, index) in quizRanking" 
                  :key="user.id"
                  class="ranking-item"
                  :class="{ 'top-three': index < 3 }"
                >
                  <div class="rank-number">
                    <span v-if="index < 3" class="medal">
                      <el-icon :size="24">
                        <component :is="getMedalIcon(index)" />
                      </el-icon>
                    </span>
                    <span v-else class="rank">{{ index + 1 }}</span>
                  </div>
                  
                  <div class="user-info">
                    <el-avatar :size="40" :src="user.avatar">
                      {{ user.nickname?.charAt(0) }}
                    </el-avatar>
                    <div class="user-details">
                      <h4>{{ user.nickname }}</h4>
                      <p>等级 {{ user.level }}</p>
                    </div>
                  </div>
                  
                  <div class="user-stats">
                    <div class="stat-item">
                      <span class="stat-value">{{ user.totalQuizCount }}</span>
                      <span class="stat-label">答题数</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ user.correctQuizCount }}</span>
                      <span class="stat-label">正确数</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="real-time-stats">
        <el-card class="stats-card">
          <template #header>
            <div class="stats-header">
              <span>实时统计</span>
              <el-icon class="refresh-icon" @click="refreshStats">
                <Refresh />
              </el-icon>
            </div>
          </template>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ realTimeStats.totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ realTimeStats.todayUsers }}</div>
              <div class="stat-label">今日新增</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ realTimeStats.totalQuizCount }}</div>
              <div class="stat-label">总答题数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ realTimeStats.todayQuizCount }}</div>
              <div class="stat-label">今日答题</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Trophy, Medal, Award, Refresh } from '@element-plus/icons-vue'

const activeTab = ref('points')

const rankingData = ref([
  {
    id: 1,
    nickname: '答题高手',
    avatar: '',
    points: 2580,
    level: 8,
    accuracy: 92,
    totalQuizCount: 156
  },
  {
    id: 2,
    nickname: '知识达人',
    avatar: '',
    points: 2340,
    level: 7,
    accuracy: 88,
    totalQuizCount: 142
  },
  {
    id: 3,
    nickname: '学习之星',
    avatar: '',
    points: 2100,
    level: 6,
    accuracy: 85,
    totalQuizCount: 128
  },
  {
    id: 4,
    nickname: '智慧学者',
    avatar: '',
    points: 1890,
    level: 6,
    accuracy: 82,
    totalQuizCount: 115
  },
  {
    id: 5,
    nickname: '知识探索者',
    avatar: '',
    points: 1650,
    level: 5,
    accuracy: 79,
    totalQuizCount: 98
  }
])

const accuracyRanking = ref([
  {
    id: 1,
    nickname: '完美主义者',
    avatar: '',
    points: 1200,
    level: 5,
    accuracy: 98,
    totalQuizCount: 45
  },
  {
    id: 2,
    nickname: '答题高手',
    avatar: '',
    points: 2580,
    level: 8,
    accuracy: 92,
    totalQuizCount: 156
  },
  {
    id: 3,
    nickname: '知识达人',
    avatar: '',
    points: 2340,
    level: 7,
    accuracy: 88,
    totalQuizCount: 142
  },
  {
    id: 4,
    nickname: '学习之星',
    avatar: '',
    points: 2100,
    level: 6,
    accuracy: 85,
    totalQuizCount: 128
  },
  {
    id: 5,
    nickname: '智慧学者',
    avatar: '',
    points: 1890,
    level: 6,
    accuracy: 82,
    totalQuizCount: 115
  }
])

const quizRanking = ref([
  {
    id: 1,
    nickname: '答题狂人',
    avatar: '',
    points: 1800,
    level: 6,
    accuracy: 75,
    totalQuizCount: 280
  },
  {
    id: 2,
    nickname: '学习机器',
    avatar: '',
    points: 1650,
    level: 5,
    accuracy: 78,
    totalQuizCount: 245
  },
  {
    id: 3,
    nickname: '知识收集家',
    avatar: '',
    points: 2100,
    level: 6,
    accuracy: 85,
    totalQuizCount: 220
  },
  {
    id: 4,
    nickname: '答题高手',
    avatar: '',
    points: 2580,
    level: 8,
    accuracy: 92,
    totalQuizCount: 156
  },
  {
    id: 5,
    nickname: '知识达人',
    avatar: '',
    points: 2340,
    level: 7,
    accuracy: 88,
    totalQuizCount: 142
  }
])

const realTimeStats = reactive({
  totalUsers: 1234,
  todayUsers: 56,
  totalQuizCount: 9876,
  todayQuizCount: 234
})

const getMedalIcon = (index) => {
  switch (index) {
    case 0: return Trophy
    case 1: return Medal
    case 2: return Award
    default: return Trophy
  }
}

const handleTabChange = (tab) => {
  console.log('切换到标签页:', tab)
}

const refreshStats = () => {
  ElMessage.success('统计数据已刷新')
  // 这里可以调用 API 刷新数据
}

onMounted(() => {
  // 初始化数据
  console.log('排行榜页面已加载')
})
</script>

<style scoped>
.ranking-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.ranking-container {
  max-width: 1000px;
  margin: 0 auto;
}

.ranking-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ranking-header h2 {
  margin: 0 0 10px;
  color: #303133;
  font-size: 32px;
}

.ranking-header p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.ranking-tabs {
  margin-bottom: 30px;
}

.ranking-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.ranking-list {
  padding: 20px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-bottom: 12px;
  border-radius: 12px;
  background: #fafafa;
  transition: all 0.3s;
}

.ranking-item:hover {
  background: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ranking-item.top-three {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border: 2px solid #ffd700;
}

.ranking-item.top-three:nth-child(2) {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  border-color: #c0c0c0;
}

.ranking-item.top-three:nth-child(3) {
  background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%);
  border-color: #cd7f32;
}

.rank-number {
  width: 60px;
  text-align: center;
  margin-right: 20px;
}

.medal {
  color: #ffd700;
}

.rank {
  font-size: 24px;
  font-weight: bold;
  color: #606266;
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
  margin-right: 20px;
}

.user-details {
  margin-left: 15px;
}

.user-details h4 {
  margin: 0 0 5px;
  color: #303133;
  font-size: 16px;
}

.user-details p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.user-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.real-time-stats {
  margin-top: 30px;
}

.stats-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refresh-icon {
  cursor: pointer;
  color: #409eff;
  transition: transform 0.3s;
}

.refresh-icon:hover {
  transform: rotate(180deg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .ranking-item {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .user-info {
    flex-direction: column;
    margin-right: 0;
  }
  
  .user-details {
    margin-left: 0;
    margin-top: 10px;
  }
  
  .user-stats {
    gap: 20px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
