<template>
  <div class="lottery-page">
    <div class="lottery-container">
      <div class="lottery-header">
        <h2>趣味抽签</h2>
        <p>公平随机，惊喜不断</p>
      </div>

      <div v-if="!lotteryStarted" class="lottery-start">
        <el-card class="start-card" v-loading="pageLoading">
          <div class="start-content">
            <h3>选择抽签类型</h3>
            <p>不同的抽签有不同的奖品和概率</p>
            
            <div v-if="!pageLoading && lotteries.length > 0" class="lottery-list">
              <div 
                v-for="lottery in lotteries" 
                :key="lottery._id"
                class="lottery-item"
                @click="selectLottery(lottery)"
              >
                <div class="lottery-icon">
                  <el-icon :size="32">
                    <component :is="getLotteryIcon(lottery.category)" />
                  </el-icon>
                </div>
                <div class="lottery-info">
                  <h4>{{ lottery.title }}</h4>
                  <p>{{ lottery.description }}</p>
                  <div class="lottery-meta">
                    <el-tag :type="getCategoryType(lottery.category)">
                      {{ getCategoryText(lottery.category) }}
                    </el-tag>
                    <span class="max-draws">每日最多 {{ lottery.maxDraws }} 次</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="!pageLoading && lotteries.length === 0" class="empty-state">
              <el-empty description="暂无抽签活动">
                <el-button type="primary" @click="fetchLotteryList">刷新</el-button>
              </el-empty>
            </div>
          </div>
        </el-card>
      </div>

      <div v-else-if="selectedLottery" class="lottery-content">
        <el-card class="lottery-card">
          <div class="lottery-title">
            <h3>{{ selectedLottery.title }}</h3>
            <p>{{ selectedLottery.description }}</p>
          </div>

          <div class="lottery-wheel">
            <div class="wheel-container">
              <div 
                class="wheel" 
                :class="{ spinning: isSpinning }"
                :style="getWheelStyle(selectedLottery.items.length)"
              >
                <div 
                  v-for="(item, index) in selectedLottery.items" 
                  :key="index"
                  class="wheel-item"
                  :style="getItemStyle(index, selectedLottery.items.length)"
                >
                  <span class="item-text">{{ item }}</span>
                </div>
              </div>
              <div class="wheel-center"></div>
              <div class="wheel-pointer"></div>
            </div>
          </div>

          <div class="lottery-actions">
            <el-button 
              type="primary" 
              size="large"
              :loading="isSpinning"
              :disabled="isSpinning"
              @click="startLottery"
            >
              {{ isSpinning ? '抽签中...' : '开始抽签' }}
            </el-button>
          </div>
        </el-card>
      </div>

      <div v-if="lotteryResult" class="lottery-result">
        <el-card class="result-card">
          <div class="result-content">
            <div class="result-icon">
              <el-icon :size="64" :color="result.points > 0 ? '#67c23a' : '#909399'">
                <Trophy v-if="result.points > 0" />
                <Warning v-else />
              </el-icon>
            </div>
            <h2>{{ result.item }}</h2>
            <p v-if="result.points > 0">恭喜获得 {{ result.points }} 积分！</p>
            <p v-else>谢谢参与，下次再来！</p>
            
            <div class="result-actions">
              <el-button @click="resetLottery">再次抽签</el-button>
              <el-button type="primary" @click="goHome">返回首页</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <div class="lottery-history">
        <h3>抽签记录</h3>
        <el-table :data="history" style="width: 100%">
          <el-table-column prop="lotteryTitle" label="抽签类型" />
          <el-table-column prop="result" label="结果" />
          <el-table-column prop="points" label="积分" />
          <el-table-column prop="createdAt" label="时间" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Trophy, Warning, Star, MagicStick, Present } from '@element-plus/icons-vue'
import { getLotteryList, drawLottery, getLotteryHistory } from '@/api/lottery'

const router = useRouter()

const lotteryStarted = ref(false)
const selectedLottery = ref(null)
const isSpinning = ref(false)
const wheelRotation = ref(0)
const lotteryResult = ref(null)
const loading = ref(false)
const pageLoading = ref(true)

const lotteries = ref([])
const history = ref([])

const result = reactive({
  item: '',
  points: 0
})

const selectLottery = (lottery) => {
  selectedLottery.value = lottery
  lotteryStarted.value = true
}

const startLottery = async () => {
  if (isSpinning.value || loading.value) return
  
  isSpinning.value = true
  loading.value = true
  wheelRotation.value = 0
  
  try {
    // 调用后端API执行抽签
    const response = await drawLottery(selectedLottery.value._id)
    const drawResult = response.data.result
    
    // 找到对应的物品索引
    const selectedIndex = selectedLottery.value.items.indexOf(drawResult.item)
    
    // 模拟转盘旋转
    const spins = 5 + Math.random() * 2 // 5-7圈
    const itemAngle = 360 / selectedLottery.value.items.length
    const finalRotation = spins * 360 + (selectedIndex * itemAngle)
    wheelRotation.value = finalRotation
    
    setTimeout(() => {
      result.item = drawResult.item
      result.points = drawResult.points || 0
      
      isSpinning.value = false
      loading.value = false
      lotteryResult.value = { ...result }
      
      if (result.points > 0) {
        ElMessage.success(`恭喜获得 ${result.points} 积分！`)
      } else {
        ElMessage.info('谢谢参与，下次再来！')
      }
      
      // 刷新历史记录
      fetchHistory()
    }, 3000)
  } catch (error) {
    isSpinning.value = false
    loading.value = false
    ElMessage.error(error.response?.data?.message || '抽签失败，请重试')
  }
}

const calculatePoints = (probability) => {
  if (probability >= 50) return 5
  if (probability >= 20) return 10
  if (probability >= 10) return 20
  if (probability >= 5) return 50
  return 100
}

const resetLottery = () => {
  lotteryStarted.value = false
  selectedLottery.value = null
  lotteryResult.value = null
  wheelRotation.value = 0
}

const goHome = () => {
  router.push('/')
}

const getLotteryIcon = (category) => {
  switch (category) {
    case 'daily': return Star
    case 'weekly': return MagicStick
    case 'special': return Present
    case 'event': return Trophy
    default: return Star
  }
}

const getCategoryType = (category) => {
  switch (category) {
    case 'daily': return 'success'
    case 'weekly': return 'warning'
    case 'special': return 'danger'
    default: return 'info'
  }
}

const getCategoryText = (category) => {
  switch (category) {
    case 'daily': return '每日'
    case 'weekly': return '周末'
    case 'special': return '特别'
    default: return '未知'
  }
}

// 生成轮盘渐变色
const getWheelStyle = (total) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a29bfe', '#fd79a8']
  const angle = 360 / total
  
  let gradientStops = []
  for (let i = 0; i < total; i++) {
    const color = colors[i % colors.length]
    const startDeg = i * angle
    const endDeg = (i + 1) * angle
    gradientStops.push(`${color} ${startDeg}deg ${endDeg}deg`)
  }
  
  return {
    background: `conic-gradient(${gradientStops.join(', ')})`,
    transform: `rotate(${wheelRotation.value}deg)`
  }
}

// 计算每个奖品在轮盘上的位置样式
const getItemStyle = (index, total) => {
  const angle = 360 / total  // 每个扇形的角度
  const rotation = index * angle  // 当前扇形的旋转角度
  const offsetAngle = angle / 2  // 偏移到扇形中心的角度
  
  return {
    transform: `rotate(${rotation + offsetAngle}deg) translateX(100px) rotate(-${rotation + offsetAngle}deg)`
  }
}

// 获取抽签列表
const fetchLotteryList = async () => {
  pageLoading.value = true
  try {
    const response = await getLotteryList({ status: 'active' })
    console.log('抽签列表响应:', response)
    lotteries.value = response.data.lotteries || []
    console.log('抽签列表数据:', lotteries.value)
  } catch (error) {
    console.error('获取抽签列表失败:', error)
    ElMessage.error(error.response?.data?.message || '获取抽签列表失败')
  } finally {
    pageLoading.value = false
  }
}

// 获取抽签历史
const fetchHistory = async () => {
  try {
    const response = await getLotteryHistory({ page: 1, limit: 10 })
    console.log('抽签历史响应:', response)
    history.value = response.data.records.map(record => ({
      lotteryTitle: record.lotteryId?.title || '未知抽签',
      result: record.result?.item || '未知',
      points: record.points || 0,
      createdAt: new Date(record.createdAt).toLocaleString('zh-CN')
    }))
  } catch (error) {
    console.error('获取抽签历史失败:', error)
    // 历史记录失败不影响主功能，静默处理
  }
}

onMounted(() => {
  fetchLotteryList()
  fetchHistory()
})
</script>

<style scoped>
.lottery-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.lottery-container {
  max-width: 800px;
  margin: 0 auto;
}

.lottery-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.lottery-header h2 {
  margin: 0 0 10px;
  color: #303133;
  font-size: 32px;
}

.lottery-header p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.lottery-start {
  margin-bottom: 30px;
}

.start-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.start-content {
  padding: 40px;
}

.start-content h3 {
  text-align: center;
  font-size: 24px;
  margin-bottom: 15px;
  color: #303133;
}

.start-content p {
  text-align: center;
  color: #606266;
  margin-bottom: 30px;
}

.lottery-list {
  display: grid;
  gap: 20px;
}

.lottery-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.lottery-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.lottery-icon {
  margin-right: 20px;
  color: #409eff;
}

.lottery-info h4 {
  margin: 0 0 8px;
  color: #303133;
  font-size: 18px;
}

.lottery-info p {
  margin: 0 0 12px;
  color: #606266;
  font-size: 14px;
}

.lottery-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.max-draws {
  color: #909399;
  font-size: 12px;
}

.lottery-content {
  margin-bottom: 30px;
}

.lottery-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.lottery-title {
  text-align: center;
  margin-bottom: 40px;
}

.lottery-title h3 {
  margin: 0 0 10px;
  color: #303133;
  font-size: 24px;
}

.lottery-title p {
  margin: 0;
  color: #606266;
}

.lottery-wheel {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.wheel-container {
  width: 300px;
  height: 300px;
  position: relative;
  margin: 0 auto;
}

.wheel-pointer {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 30px solid #f56c6c;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid #409eff;
  position: relative;
  transition: transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  border: 3px solid #409eff;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.wheel-item {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  color: white;
  font-weight: bold;
  font-size: 14px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-text {
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 12px;
  border-radius: 20px;
  white-space: nowrap;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.lottery-actions {
  text-align: center;
}

.lottery-result {
  margin-bottom: 30px;
}

.result-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-content {
  text-align: center;
  padding: 40px;
}

.result-icon {
  margin-bottom: 20px;
}

.result-content h2 {
  margin: 0 0 15px;
  color: #303133;
  font-size: 28px;
}

.result-content p {
  margin: 0 0 30px;
  color: #606266;
  font-size: 16px;
}

.result-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.lottery-history {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.lottery-history h3 {
  margin: 0 0 20px;
  color: #303133;
}

@media (max-width: 768px) {
  .lottery-item {
    flex-direction: column;
    text-align: center;
  }
  
  .lottery-icon {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .wheel-container {
    width: 250px;
    height: 250px;
  }
  
  .result-actions {
    flex-direction: column;
  }
}
</style>
