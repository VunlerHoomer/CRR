<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-form">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p>{{ accountType === 'user' ? '用户登录' : '管理员登录' }}</p>
        </div>

        <!-- 账号类型切换 -->
        <div class="account-type-switch">
          <el-radio-group v-model="accountType" @change="switchAccountType">
            <el-radio-button label="user">用户登录</el-radio-button>
            <el-radio-button label="admin">管理员登录</el-radio-button>
          </el-radio-group>
        </div>
        
        <!-- 用户登录方式切换 -->
        <div v-if="accountType === 'user'" class="login-type-tabs">
          <div 
            class="tab-item" 
            :class="{ active: loginType === 'code' }"
            @click="switchLoginType('code')"
          >
            验证码登录
          </div>
          <div 
            class="tab-item" 
            :class="{ active: loginType === 'password' }"
            @click="switchLoginType('password')"
          >
            密码登录
          </div>
        </div>
        
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form-content"
          @submit.prevent="handleLogin"
        >
          <!-- 用户登录 -->
          <template v-if="accountType === 'user'">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名、手机号或邮箱"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            
            <!-- 验证码登录 -->
            <template v-if="loginType === 'code'">
              <el-form-item prop="code">
                <div class="code-input-group">
                  <el-input
                    v-model="loginForm.code"
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
            </template>
            
            <!-- 密码登录 -->
            <template v-else>
              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="请输入密码"
                  size="large"
                  :prefix-icon="Lock"
                  show-password
                />
              </el-form-item>
            </template>
          </template>

          <!-- 管理员登录 -->
          <template v-else>
            <el-form-item prop="adminUsername">
              <el-input
                v-model="loginForm.adminUsername"
                placeholder="请输入管理员用户名"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>

            <el-form-item prop="adminPassword">
              <el-input
                v-model="loginForm.adminPassword"
                type="password"
                placeholder="请输入管理员密码"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
          </template>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-button"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="form-footer" v-if="accountType === 'user'">
          <p>
            还没有账号？
            <el-button type="text" @click="$router.push('/register')">
              立即注册
            </el-button>
          </p>
        </div>
      </div>
      
      <div class="login-banner">
        <div class="banner-content">
          <div class="logo-container">
            <img src="/images/crr-logo.png" alt="CRR城市定向" class="crr-logo" />
          </div>
          <h3>CRR城市定向</h3>
          <p>探索城市 · 定向挑战 · 团队协作</p>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon><Location /></el-icon>
              <span>城市探索，定向挑战</span>
            </div>
            <div class="feature-item">
              <el-icon><Trophy /></el-icon>
              <span>团队协作，勇争第一</span>
            </div>
            <div class="feature-item">
              <el-icon><Star /></el-icon>
              <span>积分奖励，成就解锁</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useAdminStore } from '@/store/admin'
import { sendSmsCode } from '@/api/user'
import { ElMessage } from 'element-plus'
import { Phone, Message, Lock, User, Location, Trophy, Star } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const adminStore = useAdminStore()

const loginFormRef = ref()
const loading = ref(false)
const codeCountdown = ref(0)
const accountType = ref('user') // 'user' 或 'admin'
const loginType = ref('code') // 'code' 或 'password'（仅用户登录）

const loginForm = reactive({
  username: '',
  code: '',
  password: '',
  adminUsername: '',
  adminPassword: ''
})

const loginRules = computed(() => {
  const rules = {}
  
  if (accountType.value === 'user') {
    rules.username = [
      { required: true, message: '请输入用户名、手机号或邮箱', trigger: 'blur' }
    ]
    
    if (loginType.value === 'code') {
      rules.code = [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { pattern: /^\d{6}$/, message: '请输入6位数字验证码', trigger: 'blur' }
      ]
    } else {
      rules.password = [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少6位', trigger: 'blur' }
      ]
    }
  } else {
    // 管理员登录
    rules.adminUsername = [
      { required: true, message: '请输入管理员用户名', trigger: 'blur' },
      { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
    ]
    rules.adminPassword = [
      { required: true, message: '请输入管理员密码', trigger: 'blur' },
      { min: 6, message: '密码至少6位', trigger: 'blur' }
    ]
  }
  
  return rules
})

// 发送验证码
const sendCode = async () => {
  if (!loginForm.username) {
    ElMessage.warning('请先输入手机号')
    return
  }
  
  // 检查是否是手机号格式
  if (!/^1[3-9]\d{9}$/.test(loginForm.username)) {
    ElMessage.warning('验证码登录需要输入手机号')
    return
  }
  
  try {
    await sendSmsCode(loginForm.username)
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

// 切换账号类型
const switchAccountType = () => {
  // 清空表单
  loginForm.username = ''
  loginForm.code = ''
  loginForm.password = ''
  loginForm.adminUsername = ''
  loginForm.adminPassword = ''
  if (loginFormRef.value) {
    loginFormRef.value.clearValidate()
  }
}

// 切换登录方式（仅用户）
const switchLoginType = (type) => {
  loginType.value = type
  // 清空表单
  loginForm.code = ''
  loginForm.password = ''
  if (loginFormRef.value) {
    loginFormRef.value.clearValidate()
  }
}

// 登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    if (accountType.value === 'user') {
      // 用户登录
      const loginData = {
        loginType: loginType.value
      }
      
      if (loginType.value === 'code') {
        // 验证码登录需要手机号
        if (!/^1[3-9]\d{9}$/.test(loginForm.username)) {
          ElMessage.error('验证码登录需要输入手机号')
          return
        }
        loginData.phone = loginForm.username
        loginData.code = loginForm.code
      } else {
        // 密码登录支持用户名、手机号、邮箱
        if (/^1[3-9]\d{9}$/.test(loginForm.username)) {
          // 手机号登录
          loginData.phone = loginForm.username
        } else if (/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(loginForm.username)) {
          // 邮箱登录
          loginData.email = loginForm.username
        } else {
          // 用户名登录
          loginData.username = loginForm.username
        }
        loginData.password = loginForm.password
      }
      
      await userStore.loginUser(loginData)
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      // 管理员登录
      await adminStore.login(loginForm.adminUsername, loginForm.adminPassword)
      ElMessage.success('管理员登录成功')
      router.push('/admin/dashboard')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  max-width: 900px;
  width: 100%;
  min-height: 600px;
}

.login-form {
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

.login-form-content {
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

.login-button {
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

.login-type-tabs {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 2px solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  cursor: pointer;
  color: #606266;
  font-size: 16px;
  transition: all 0.3s;
  position: relative;
}

.tab-item.active {
  color: #409eff;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #409eff;
}

.tab-item:hover {
  color: #409eff;
}

.account-type-switch {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.account-type-switch :deep(.el-radio-group) {
  width: 100%;
}

.account-type-switch :deep(.el-radio-button) {
  flex: 1;
}

.account-type-switch :deep(.el-radio-button__inner) {
  width: 100%;
}

.login-banner {
  flex: 1;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-content {
  text-align: center;
}

.logo-container {
  margin-bottom: 20px;
}

.crr-logo {
  width: 120px;
  height: auto;
  border-radius: 8px;
}

.banner-content h3 {
  font-size: 32px;
  margin-bottom: 15px;
  font-weight: bold;
}

.banner-content p {
  font-size: 16px;
  margin-bottom: 30px;
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
  .login-container {
    flex-direction: column;
    max-width: 400px;
  }
  
  .login-banner {
    display: none;
  }
  
  .login-form {
    padding: 40px 30px;
  }
}
</style>
