<template>
  <div class="home">
    <!-- 轮播图区域 -->
    <el-carousel height="400px" class="banner">
      <el-carousel-item v-for="(item, index) in banners" :key="index">
        <div class="banner-item" :style="{ backgroundImage: `url(${item.image})` }">
          <div class="banner-content">
            <h2>{{ item.title }}</h2>
            <p>{{ item.description }}</p>
            <el-button type="primary" size="large" @click="handleBannerAction(item.action)">
              {{ item.buttonText }}
            </el-button>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- 功能模块区域 -->
    <div class="features">
      <div class="container">
        <h2 class="section-title">功能特色</h2>
        <el-row :gutter="30">
          <el-col :xs="24" :sm="12" :md="8" v-for="feature in features" :key="feature.id">
            <div class="feature-card" @click="handleFeatureClick(feature)">
              <div class="feature-icon">
                <el-icon :size="48">
                  <component :is="feature.icon" />
                </el-icon>
              </div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 实时数据区域 -->
    <div class="stats">
      <div class="container">
        <h2 class="section-title">实时数据</h2>
        <el-row :gutter="30">
          <el-col :xs="12" :sm="6" v-for="stat in stats" :key="stat.id">
            <div class="stat-card">
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 最新动态区域 -->
    <div class="news">
      <div class="container">
        <h2 class="section-title">最新动态</h2>
        <el-row :gutter="30">
          <el-col :xs="24" :sm="12" :md="8" v-for="news in newsList" :key="news.id">
            <el-card class="news-card" shadow="hover">
              <div class="news-content">
                <h4>{{ news.title }}</h4>
                <p>{{ news.summary }}</p>
                <div class="news-meta">
                  <span>{{ news.time }}</span>
                  <el-button type="text" @click="viewNews(news)">查看详情</el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const banners = ref([
  {
    title: '智能答题系统',
    description: '海量题库，智能出题，挑战你的知识极限',
    buttonText: '开始答题',
    action: 'quiz',
    image: 'https://via.placeholder.com/1200x400/409eff/ffffff?text=智能答题系统'
  },
  {
    title: '趣味抽签功能',
    description: '随机抽取，公平公正，增加互动乐趣',
    buttonText: '立即抽签',
    action: 'lottery',
    image: 'https://via.placeholder.com/1200x400/67c23a/ffffff?text=趣味抽签功能'
  },
  {
    title: '实时互动社区',
    description: '实时排名，互动评论，打造学习社区',
    buttonText: '加入社区',
    action: 'ranking',
    image: 'https://via.placeholder.com/1200x400/e6a23c/ffffff?text=实时互动社区'
  }
])

const features = ref([
  {
    id: 1,
    title: '智能答题',
    description: 'AI智能出题，个性化难度调整',
    icon: 'EditPen',
    route: '/quiz'
  },
  {
    id: 2,
    title: '随机抽签',
    description: '公平随机算法，结果透明可查',
    icon: 'MagicStick',
    route: '/lottery'
  },
  {
    id: 3,
    title: '实时排名',
    description: '实时更新排名，激发学习动力',
    icon: 'Trophy',
    route: '/ranking'
  },
  {
    id: 4,
    title: '积分系统',
    description: '答题获得积分，兑换精美礼品',
    icon: 'Star',
    route: '/profile'
  },
  {
    id: 5,
    title: '互动评论',
    description: '与好友互动，分享学习心得',
    icon: 'ChatDotRound',
    route: '/ranking'
  },
  {
    id: 6,
    title: '数据分析',
    description: '详细学习报告，助力成长进步',
    icon: 'TrendCharts',
    route: '/profile'
  }
])

const stats = ref([
  { id: 1, label: '注册用户', value: '12,345' },
  { id: 2, label: '答题总数', value: '98,765' },
  { id: 3, label: '抽签次数', value: '45,678' },
  { id: 4, label: '今日活跃', value: '2,345' }
])

const newsList = ref([
  {
    id: 1,
    title: '新功能上线：AI智能出题系统',
    summary: '基于机器学习的智能出题算法，为每位用户量身定制题目难度...',
    time: '2小时前'
  },
  {
    id: 2,
    title: '积分商城新增精美礼品',
    summary: '用答题获得的积分兑换精美礼品，学习更有动力...',
    time: '1天前'
  },
  {
    id: 3,
    title: '答题挑战赛即将开始',
    summary: '每月一次的答题挑战赛，丰厚奖品等你来拿...',
    time: '3天前'
  }
])

const handleBannerAction = (action) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  switch (action) {
    case 'quiz':
      router.push('/quiz')
      break
    case 'lottery':
      router.push('/lottery')
      break
    case 'ranking':
      router.push('/ranking')
      break
  }
}

const handleFeatureClick = (feature) => {
  if (feature.route === '/quiz' || feature.route === '/lottery') {
    if (!userStore.isLoggedIn) {
      router.push('/login')
      return
    }
  }
  router.push(feature.route)
}

const viewNews = (news) => {
  // 这里可以跳转到新闻详情页
  console.log('查看新闻:', news.title)
}

onMounted(() => {
  // 获取实时数据
  fetchStats()
})

const fetchStats = async () => {
  // 这里调用API获取实时统计数据
  // 暂时使用模拟数据
}
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.banner {
  margin-bottom: 60px;
}

.banner-item {
  height: 400px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.banner-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
}

.banner-content {
  text-align: center;
  color: white;
  z-index: 1;
  position: relative;
}

.banner-content h2 {
  font-size: 48px;
  margin-bottom: 20px;
  font-weight: bold;
}

.banner-content p {
  font-size: 20px;
  margin-bottom: 30px;
  opacity: 0.9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  text-align: center;
  font-size: 32px;
  margin-bottom: 50px;
  color: #303133;
}

.features {
  padding: 80px 0;
  background: #f8f9fa;
}

.feature-card {
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  color: #409eff;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #303133;
}

.feature-card p {
  color: #606266;
  line-height: 1.6;
}

.stats {
  padding: 80px 0;
  background: white;
}

.stat-card {
  text-align: center;
  padding: 30px 20px;
}

.stat-number {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #606266;
}

.news {
  padding: 80px 0;
  background: #f8f9fa;
}

.news-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s;
}

.news-card:hover {
  transform: translateY(-4px);
}

.news-content h4 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #303133;
}

.news-content p {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 14px;
}
</style>
