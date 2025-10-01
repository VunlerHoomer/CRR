<template>
  <div class="quiz-page">
    <div class="quiz-container">
      <div class="quiz-header">
        <h2>智能答题</h2>
        <div class="quiz-stats">
          <el-tag type="success">积分: {{ user?.points || 0 }}</el-tag>
          <el-tag type="info">等级: {{ user?.level || 1 }}</el-tag>
          <el-tag type="warning">准确率: {{ user?.accuracy || 0 }}%</el-tag>
        </div>
      </div>

      <div v-if="!quizStarted" class="quiz-start">
        <el-card class="start-card">
          <div class="start-content">
            <h3>准备开始答题</h3>
            <p>选择答题模式和难度，开始你的知识挑战之旅</p>
            
            <div class="mode-selection">
              <el-radio-group v-model="quizMode" size="large">
                <el-radio-button label="random">随机模式</el-radio-button>
                <el-radio-button label="category">分类模式</el-radio-button>
              </el-radio-group>
            </div>

            <div v-if="quizMode === 'category'" class="category-selection">
              <el-select v-model="selectedCategory" placeholder="选择分类" size="large">
                <el-option label="综合" value="general" />
                <el-option label="科学" value="science" />
                <el-option label="历史" value="history" />
                <el-option label="文学" value="literature" />
                <el-option label="体育" value="sports" />
                <el-option label="娱乐" value="entertainment" />
              </el-select>
            </div>

            <div class="difficulty-selection">
              <el-radio-group v-model="difficulty" size="large">
                <el-radio-button label="easy">简单</el-radio-button>
                <el-radio-button label="medium">中等</el-radio-button>
                <el-radio-button label="hard">困难</el-radio-button>
              </el-radio-group>
            </div>

            <div class="question-count">
              <el-input-number
                v-model="questionCount"
                :min="5"
                :max="50"
                size="large"
                controls-position="right"
              />
              <span>道题目</span>
            </div>

            <el-button
              type="primary"
              size="large"
              @click="startQuiz"
              :loading="loading"
            >
              开始答题
            </el-button>
          </div>
        </el-card>
      </div>

      <div v-else-if="currentQuestion" class="quiz-content">
        <div class="quiz-progress">
          <el-progress
            :percentage="Math.round((currentQuestionIndex / questions.length) * 100)"
            :stroke-width="8"
            status="success"
          />
          <span class="progress-text">
            {{ currentQuestionIndex + 1 }} / {{ questions.length }}
          </span>
        </div>

        <el-card class="question-card">
          <div class="question-header">
            <el-tag :type="getDifficultyType(currentQuestion.difficulty)">
              {{ getDifficultyText(currentQuestion.difficulty) }}
            </el-tag>
            <el-tag type="info">{{ getCategoryText(currentQuestion.category) }}</el-tag>
          </div>

          <div class="question-content">
            <h3>{{ currentQuestion.question }}</h3>
            
            <div class="options">
              <el-radio-group v-model="selectedAnswer" @change="onAnswerChange">
                <el-radio
                  v-for="(option, index) in currentQuestion.options"
                  :key="index"
                  :label="option"
                  class="option-item"
                >
                  {{ option }}
                </el-radio>
              </el-radio-group>
            </div>
          </div>

          <div class="question-actions">
            <el-button
              v-if="currentQuestionIndex > 0"
              @click="previousQuestion"
            >
              上一题
            </el-button>
            
            <el-button
              type="primary"
              @click="nextQuestion"
              :disabled="!selectedAnswer"
            >
              {{ currentQuestionIndex === questions.length - 1 ? '完成答题' : '下一题' }}
            </el-button>
          </div>
        </el-card>
      </div>

      <div v-else-if="quizCompleted" class="quiz-result">
        <el-card class="result-card">
          <div class="result-content">
            <div class="result-header">
              <el-icon :size="64" :color="result.score >= 60 ? '#67c23a' : '#f56c6c'">
                <component :is="result.score >= 60 ? 'Trophy' : 'Warning'" />
              </el-icon>
              <h2>{{ result.score >= 60 ? '恭喜完成答题！' : '继续加油！' }}</h2>
            </div>

            <div class="result-stats">
              <div class="stat-item">
                <div class="stat-value">{{ result.score }}分</div>
                <div class="stat-label">总分</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ result.correctCount }}</div>
                <div class="stat-label">正确题数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ result.totalCount }}</div>
                <div class="stat-label">总题数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ result.points }}</div>
                <div class="stat-label">获得积分</div>
              </div>
            </div>

            <div class="result-actions">
              <el-button @click="resetQuiz">重新答题</el-button>
              <el-button type="primary" @click="$router.push('/ranking')">查看排行榜</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getQuizQuestions, submitQuizAnswer } from '@/api/quiz'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const loading = ref(false)
const quizStarted = ref(false)
const quizCompleted = ref(false)
const quizMode = ref('random')
const selectedCategory = ref('general')
const difficulty = ref('medium')
const questionCount = ref(10)

const questions = ref([])
const currentQuestionIndex = ref(0)
const selectedAnswer = ref('')
const answers = ref([])

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value]
})

const user = computed(() => userStore.user)

const result = reactive({
  score: 0,
  correctCount: 0,
  totalCount: 0,
  points: 0
})

// 开始答题
const startQuiz = async () => {
  try {
    loading.value = true
    
    const params = {
      limit: questionCount.value,
      difficulty: difficulty.value
    }
    
    if (quizMode.value === 'category') {
      params.category = selectedCategory.value
    }

    const response = await getQuizQuestions(params)
    questions.value = response.data.questions
    
    if (questions.value.length === 0) {
      ElMessage.warning('暂无题目，请稍后再试')
      return
    }

    quizStarted.value = true
    answers.value = new Array(questions.value.length).fill('')
  } catch (error) {
    ElMessage.error(error.message || '获取题目失败')
  } finally {
    loading.value = false
  }
}

// 答案选择
const onAnswerChange = (value) => {
  answers.value[currentQuestionIndex.value] = value
}

// 下一题
const nextQuestion = async () => {
  if (currentQuestionIndex.value === questions.value.length - 1) {
    // 最后一题，提交答案
    await submitQuiz()
  } else {
    currentQuestionIndex.value++
    selectedAnswer.value = answers.value[currentQuestionIndex.value] || ''
  }
}

// 上一题
const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    selectedAnswer.value = answers.value[currentQuestionIndex.value] || ''
  }
}

// 提交答题
const submitQuiz = async () => {
  try {
    loading.value = true
    
    let correctCount = 0
    let totalPoints = 0

    // 计算结果
    for (let i = 0; i < questions.value.length; i++) {
      const question = questions.value[i]
      const userAnswer = answers.value[i]
      
      if (userAnswer === question.correctAnswer) {
        correctCount++
        totalPoints += question.points || 10
      }
    }

    result.score = Math.round((correctCount / questions.value.length) * 100)
    result.correctCount = correctCount
    result.totalCount = questions.value.length
    result.points = totalPoints

    // 更新用户积分
    if (totalPoints > 0) {
      await userStore.updateUser({
        points: (user.value?.points || 0) + totalPoints
      })
    }

    quizCompleted.value = true
    ElMessage.success(`答题完成！获得 ${totalPoints} 积分`)
  } catch (error) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    loading.value = false
  }
}

// 重新答题
const resetQuiz = () => {
  quizStarted.value = false
  quizCompleted.value = false
  currentQuestionIndex.value = 0
  selectedAnswer.value = ''
  answers.value = []
  questions.value = []
}

// 获取难度类型
const getDifficultyType = (difficulty) => {
  switch (difficulty) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'danger'
    default: return 'info'
  }
}

// 获取难度文本
const getDifficultyText = (difficulty) => {
  switch (difficulty) {
    case 'easy': return '简单'
    case 'medium': return '中等'
    case 'hard': return '困难'
    default: return '未知'
  }
}

// 获取分类文本
const getCategoryText = (category) => {
  const categoryMap = {
    general: '综合',
    science: '科学',
    history: '历史',
    literature: '文学',
    sports: '体育',
    entertainment: '娱乐'
  }
  return categoryMap[category] || '未知'
}

onMounted(() => {
  // 获取用户信息
  if (userStore.isLoggedIn) {
    userStore.fetchUserInfo()
  }
})
</script>

<style scoped>
.quiz-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.quiz-container {
  max-width: 800px;
  margin: 0 auto;
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quiz-header h2 {
  margin: 0;
  color: #303133;
}

.quiz-stats {
  display: flex;
  gap: 12px;
}

.quiz-start {
  margin-bottom: 30px;
}

.start-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.start-content {
  text-align: center;
  padding: 40px;
}

.start-content h3 {
  font-size: 28px;
  margin-bottom: 15px;
  color: #303133;
}

.start-content p {
  color: #606266;
  margin-bottom: 40px;
  font-size: 16px;
}

.mode-selection,
.category-selection,
.difficulty-selection {
  margin-bottom: 30px;
}

.question-count {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 40px;
  font-size: 16px;
  color: #606266;
}

.quiz-content {
  margin-bottom: 30px;
}

.quiz-progress {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-text {
  font-weight: bold;
  color: #303133;
  min-width: 80px;
}

.question-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.question-content h3 {
  font-size: 20px;
  line-height: 1.6;
  margin-bottom: 30px;
  color: #303133;
}

.options {
  margin-bottom: 30px;
}

.option-item {
  display: block;
  margin-bottom: 15px;
  padding: 12px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.option-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.quiz-result {
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

.result-header {
  margin-bottom: 40px;
}

.result-header h2 {
  margin: 20px 0 0;
  color: #303133;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.result-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

@media (max-width: 768px) {
  .quiz-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .quiz-stats {
    justify-content: center;
  }
  
  .result-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .result-actions {
    flex-direction: column;
  }
}
</style>
