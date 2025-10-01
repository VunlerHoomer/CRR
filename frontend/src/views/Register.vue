<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-form">
        <div class="form-header">
          <h2>创建账号</h2>
          <p>使用手机号注册新账号</p>
        </div>
        
        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="register-form-content"
          @submit.prevent="handleRegister"
        >
          <el-form-item prop="phone">
            <el-input
              v-model="registerForm.phone"
              placeholder="请输入手机号"
              size="large"
              :prefix-icon="Phone"
              maxlength="11"
            />
          </el-form-item>
          
          <el-form-item prop="code">
            <div class="code-input-group">
              <el-input
                v-model="registerForm.code"
                placeholder="请输入验证码"
                size="large"
                :prefix-icon="Message"
                maxlength="6"
              />
              <el-button
                :disabled="codeCountdown > 0"
                @click="sendCode"
                class="code-button"
              >
                {{ codeCountdown > 0 ? `${codeCountdown}s后重发` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item prop="nickname">
            <el-input
              v-model="registerForm.nickname"
              placeholder="请输入昵称（可选）"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请设置密码（可选，至少6位）"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="register-button"
              :loading="loading"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="form-footer">
          <p>
            已有账号？
            <el-button type="text" @click="$router.push('/login')">
              立即登录
            </el-button>
          </p>
        </div>
      </div>
      
      <div class="register-banner">
        <div class="banner-content">
          <h3>加入我们</h3>
          <p>开启你的答题抽签之旅</p>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon><Trophy /></el-icon>
              <span>挑战自我，提升知识</span>
            </div>
            <div class="feature-item">
              <el-icon><Star /></el-icon>
              <span>积分奖励，兑换礼品</span>
            </div>
            <div class="feature-item">
              <el-icon><ChatDotRound /></el-icon>
              <span>社区互动，分享乐趣</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { sendSmsCode } from '@/api/user'
import { ElMessage } from 'element-plus'
import { Phone, Message, User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref()
const loading = ref(false)
const codeCountdown = ref(0)

const registerForm = reactive({
  phone: '',
  code: '',
  nickname: '',
  password: ''
})

const registerRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '请输入6位数字验证码', trigger: 'blur' }
  ],
  nickname: [
    { min: 2, max: 20, message: '昵称长度应在2-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

// 发送验证码
const sendCode = async () => {
  if (!registerForm.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(registerForm.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  
  try {
    await sendSmsCode(registerForm.phone)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (error) {
    ElMessage.error(error.message || '发送失败，请重试')
  }
}

// 开始倒计时
const startCountdown = () => {
  codeCountdown.value = 60
  const timer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
    loading.value = true
    
    await userStore.registerUser(registerForm)
    ElMessage.success('注册成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  max-width: 900px;
  width: 100%;
  min-height: 600px;
}

.register-form {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 10px;
}

.form-header p {
  color: #606266;
  font-size: 16px;
}

.register-form-content {
  margin-bottom: 30px;
}

.code-input-group {
  display: flex;
  gap: 12px;
}

.code-button {
  white-space: nowrap;
  min-width: 120px;
}

.register-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.form-footer {
  text-align: center;
  color: #606266;
}

.form-footer p {
  margin: 0;
}

.register-banner {
  flex: 1;
  background: linear-gradient(135deg, #67c23a 0%, #409eff 100%);
  color: white;
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-content {
  text-align: center;
}

.banner-content h3 {
  font-size: 36px;
  margin-bottom: 20px;
  font-weight: bold;
}

.banner-content p {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.9;
}

.feature-list {
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
}

.feature-item .el-icon {
  margin-right: 12px;
  font-size: 20px;
}

@media (max-width: 768px) {
  .register-container {
    flex-direction: column;
    max-width: 400px;
  }
  
  .register-banner {
    display: none;
  }
  
  .register-form {
    padding: 40px 30px;
  }
}
</style>
