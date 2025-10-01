<template>
  <div class="task-quiz">
    <div class="quiz-header">
      <h2>{{ task?.name || '答题任务' }}</h2>
      <div class="quiz-info">
        <el-tag type="primary">积分: {{ task?.points || 0 }}</el-tag>
        <el-tag type="warning">剩余时间: {{ formatTime(timeLeft) }}</el-tag>
      </div>
    </div>

    <div class="quiz-content" v-if="!quizCompleted">
      <div class="question-progress">
        <el-progress 
          :percentage="Math.round((currentQuestionIndex + 1) / questions.length * 100)"
          :show-text="false"
        />
        <span class="progress-text">
          第 {{ currentQuestionIndex + 1 }} 题 / 共 {{ questions.length }} 题
        </span>
      </div>

      <div class="question-card" v-if="currentQuestion">
        <h3 class="question-title">{{ currentQuestion.question }}</h3>
        
        <div class="question-options">
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

        <div class="question-actions">
          <el-button 
            v-if="currentQuestionIndex > 0" 
            @click="prevQuestion"
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
      </div>
    </div>

    <div class="quiz-result" v-else>
      <el-result
        :icon="quizResult.success ? 'success' : 'error'"
        :title="quizResult.success ? '答题完成！' : '答题失败'"
        :sub-title="quizResult.message"
      >
        <template #extra>
          <div class="result-details">
            <p>正确题数: {{ quizResult.correctCount }} / {{ questions.length }}</p>
            <p>获得积分: {{ quizResult.points }}</p>
            <p>用时: {{ formatTime(quizResult.timeSpent) }}</p>
          </div>
          <div class="result-actions">
            <el-button @click="goBack">返回任务中心</el-button>
            <el-button 
              v-if="!quizResult.success && canRetry" 
              type="primary" 
              @click="retryQuiz"
            >
              重新答题
            </el-button>
          </div>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const taskId = route.params.id
const task = ref(null)
const questions = ref([])
const currentQuestionIndex = ref(0)
const selectedAnswer = ref('')
const answers = ref([])
const timeLeft = ref(0)
const timer = ref(null)
const quizCompleted = ref(false)
const canRetry = ref(false)

const quizResult = reactive({
  success: false,
  message: '',
  correctCount: 0,
  points: 0,
  timeSpent: 0
})

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || null
})

// 模拟数据
const mockTask = {
  _id: taskId,
  taskId: '1',
  name: '1-1',
  description: '在静安雕塑公园完成基础地理知识答题',
  type: 'quiz',
  points: 20,
  quizConfig: {
    timeLimit: 300
  }
}

const mockQuestions = [
  {
    _id: '1',
    question: '上海是中国的哪个直辖市？',
    options: ['北京', '上海', '天津', '重庆'],
    correctAnswer: '上海'
  },
  {
    _id: '2',
    question: '静安雕塑公园位于哪个区？',
    options: ['黄浦区', '静安区', '徐汇区', '长宁区'],
    correctAnswer: '静安区'
  }
]

// 初始化答题数据
const initQuiz = () => {
  task.value = mockTask
  questions.value = mockQuestions
  timeLeft.value = task.value.quizConfig?.timeLimit || 300
  answers.value = new Array(questions.value.length).fill('')
  
  // 开始计时
  startTimer()
}

// 开始计时
const startTimer = () => {
  timer.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      submitQuiz()
    }
  }, 1000)
}

// 停止计时
const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

// 答题变化
const onAnswerChange = (value) => {
  answers.value[currentQuestionIndex.value] = value
}

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    selectedAnswer.value = answers.value[currentQuestionIndex.value] || ''
  } else {
    submitQuiz()
  }
}

// 上一题
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    selectedAnswer.value = answers.value[currentQuestionIndex.value] || ''
  }
}

// 提交答题
const submitQuiz = async () => {
  stopTimer()
  
  const startTime = Date.now()
  const timeSpent = Math.max(0, (task.value.quizConfig?.timeLimit || 300) - timeLeft.value)
  
  try {
    // 模拟提交延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const correctCount = calculateCorrectAnswers()
    const success = correctCount >= (task.value.quizConfig?.requiredCorrect || 1)
    
    quizResult.success = success
    quizResult.message = success ? '恭喜完成任务！' : '任务失败，请重试'
    quizResult.points = success ? task.value.points : 0
    quizResult.correctCount = correctCount
    quizResult.timeSpent = timeSpent
    canRetry.value = !success
    quizCompleted.value = true
    
    if (success) {
      ElMessage.success('任务完成！')
    } else {
      ElMessage.error('任务失败')
    }
  } catch (error) {
    ElMessage.error('提交答题失败')
    canRetry.value = true
    quizCompleted.value = true
  }
}

// 计算正确答案数
const calculateCorrectAnswers = () => {
  let correctCount = 0
  questions.value.forEach((question, index) => {
    if (answers.value[index] === question.correctAnswer) {
      correctCount++
    }
  })
  return correctCount
}

// 重新答题
const retryQuiz = () => {
  currentQuestionIndex.value = 0
  selectedAnswer.value = ''
  answers.value = new Array(questions.value.length).fill('')
  timeLeft.value = task.value.quizConfig?.timeLimit || 300
  quizCompleted.value = false
  startTimer()
}

// 返回任务中心
const goBack = () => {
  router.push('/task-center')
}

// 格式化时间
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

onMounted(() => {
  initQuiz()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.task-quiz {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
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
  font-size: 24px;
}

.quiz-info {
  display: flex;
  gap: 15px;
}

.quiz-content {
  max-width: 800px;
  margin: 0 auto;
}

.question-progress {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-text {
  display: block;
  text-align: center;
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}

.question-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.question-title {
  margin: 0 0 30px;
  color: #303133;
  font-size: 20px;
  line-height: 1.6;
}

.question-options {
  margin-bottom: 30px;
}

.option-item {
  display: block;
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.option-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.option-item.is-checked {
  border-color: #409eff;
  background-color: #e6f7ff;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.quiz-result {
  max-width: 600px;
  margin: 0 auto;
}

.result-details {
  text-align: center;
  margin: 20px 0;
}

.result-details p {
  margin: 10px 0;
  font-size: 16px;
  color: #606266;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

@media (max-width: 768px) {
  .quiz-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .quiz-info {
    justify-content: center;
  }
  
  .question-card {
    padding: 20px;
  }
  
  .question-title {
    font-size: 18px;
  }
  
  .question-actions {
    flex-direction: column;
  }
}
</style>
