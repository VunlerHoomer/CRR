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

    <!-- 每期活动区域 -->
    <div class="activities">
      <div class="container">
        <h2 class="section-title">每期活动</h2>
        <el-row :gutter="30">
          <el-col :xs="24" :sm="12" :md="8" v-for="activity in activityList" :key="activity.id">
            <el-card class="activity-card" shadow="hover" @click="viewActivity(activity)">
              <div class="activity-content">
                <div class="activity-image">
                  <LazyImage 
                    :src="activity.banner" 
                    :alt="activity.title"
                    width="100%"
                    height="200px"
                  />
                  <div class="activity-status" :class="activity.status">
                    {{ getStatusText(activity.status) }}
                  </div>
                </div>
                <h4>{{ activity.title }}</h4>
                <p>{{ activity.description }}</p>
                <div class="activity-meta">
                  <div class="activity-info">
                    <el-icon><Location /></el-icon>
                    <span>{{ activity.location }}</span>
                  </div>
                  <div class="activity-info">
                    <el-icon><Calendar /></el-icon>
                    <span>{{ formatDate(activity.startTime) }}</span>
                  </div>
                  <div class="activity-info">
                    <el-icon><User /></el-icon>
                    <span>{{ activity.currentParticipants }}/{{ activity.maxParticipants }}</span>
                  </div>
                </div>
                <el-button type="primary" size="small" class="activity-button">
                  查看详情
                </el-button>
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
import { getActivityList } from '@/api/activity'
import { Location, Calendar, User } from '@element-plus/icons-vue'
import LazyImage from '@/components/LazyImage.vue'

const router = useRouter()
const userStore = useUserStore()

const banners = ref([
  {
    title: '城市定向挑战',
    description: '探索城市，定向挑战，团队协作',
    buttonText: '查看活动',
    action: 'activity',
    image: 'https://placehold.co/1200x400/409eff/ffffff?text=城市定向挑战'
  },
  {
    title: '趣味抽签功能',
    description: '随机抽取，公平公正，增加互动乐趣',
    buttonText: '立即抽签',
    action: 'lottery',
    image: 'https://placehold.co/1200x400/67c23a/ffffff?text=趣味抽签功能'
  },
  {
    title: '实时互动社区',
    description: '实时排名，互动评论，打造活动社区',
    buttonText: '加入社区',
    action: 'ranking',
    image: 'https://placehold.co/1200x400/e6a23c/ffffff?text=实时互动社区'
  }
])

const features = ref([
  {
    id: 1,
    title: '随机抽签',
    description: '公平随机算法，结果透明可查',
    icon: 'MagicStick',
    route: '/lottery'
  },
  {
    id: 2,
    title: '实时排名',
    description: '实时更新排名，激发学习动力',
    icon: 'Trophy',
    route: '/ranking'
  },
  {
    id: 3,
    title: '积分系统',
    description: '参与活动获得积分，兑换精美礼品',
    icon: 'Star',
    route: '/profile'
  },
  {
    id: 4,
    title: '互动评论',
    description: '与好友互动，分享活动心得',
    icon: 'ChatDotRound',
    route: '/ranking'
  }
])

const stats = ref([
  { id: 1, label: '注册用户', value: '12,345' },
  { id: 2, label: '活动参与', value: '8,765' },
  { id: 3, label: '抽签次数', value: '45,678' },
  { id: 4, label: '今日活跃', value: '2,345' }
])

const activityList = ref([])

const handleBannerAction = (action) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  switch (action) {
    case 'activity':
      router.push('/activity-center')
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
  if (feature.route === '/lottery') {
    if (!userStore.isLoggedIn) {
      router.push('/login')
      return
    }
  }
  router.push(feature.route)
}

// 查看活动详情
const viewActivity = (activity) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push(`/activity/${activity._id}`)
}

// 获取活动状态文本
const getStatusText = (status) => {
  const statusMap = {
    upcoming: '即将开始',
    ongoing: '进行中',
    ended: '已结束',
    cancelled: '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

onMounted(() => {
  // 获取实时数据
  fetchStats()
  // 获取活动列表
  fetchActivities()
})

const fetchStats = async () => {
  // 这里调用API获取实时统计数据
  // 暂时使用模拟数据
}

// 获取活动列表
const fetchActivities = async () => {
  try {
    const response = await getActivityList({ limit: 6 })
    if (response.code === 200) {
      activityList.value = response.data.activities || []
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
    // 使用模拟数据作为后备
    activityList.value = [
      {
        _id: '1',
        title: '溯槎问帙',
        description: '溯槎问帙，探索未知的奇幻世界。在这场充满神秘色彩的冒险中，你将穿越时空的漩涡，寻找失落的宝藏，揭开古老的秘密。',
        banner: '/images/activities/suchawenzhi.jpg',
        location: '上海市徐汇区',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        currentParticipants: 45,
        maxParticipants: 150,
        status: 'upcoming'
      },
      {
        _id: '2',
        title: '末之凉秋',
        description: '在秋意渐浓的季节里，体验城市定向的乐趣。感受秋风的清爽，探索城市的魅力，与团队一起完成挑战。',
        banner: '/images/activities/late-autumn.jpg',
        location: '上海市静安区',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currentParticipants: 23,
        maxParticipants: 100,
        status: 'upcoming'
      }
    ]
  }
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

.activities {
  padding: 80px 0;
  background: #f8f9fa;
}

.activity-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.activity-card:hover {
  transform: translateY(-4px);
}

.activity-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.activity-image {
  position: relative;
  width: 100%;
  height: 200px;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.activity-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.activity-status.upcoming {
  background: #409eff;
}

.activity-status.ongoing {
  background: #67c23a;
}

.activity-status.ended {
  background: #909399;
}

.activity-status.cancelled {
  background: #f56c6c;
}

.activity-content h4 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #303133;
  flex-shrink: 0;
}

.activity-content p {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-meta {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.activity-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.activity-info .el-icon {
  margin-right: 8px;
  color: #409eff;
}

.activity-button {
  width: 100%;
  flex-shrink: 0;
}
</style>
