<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-form">
        <div class="form-header">
          <h2>创建账户</h2>
          <p>填写信息完成注册</p>
        </div>
        
        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="register-form-content"
          @submit.prevent="handleRegister"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名 (可选)"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="phone">
            <el-input
              v-model="registerForm.phone"
              placeholder="请输入手机号"
              size="large"
              :prefix-icon="Phone"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱 (可选)"
              size="large"
              :prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item>
            <div class="consent-section">
              <el-checkbox v-model="registerForm.consent" class="consent-checkbox">
                我同意收集上述数据并用于上述用途
              </el-checkbox>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="register-button"
              :loading="loading"
              @click="handleRegister"
            >
              注册并登录
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
          <div class="logo-container">
            <img src="/images/crr-logo.png" alt="CRR城市定向" class="crr-logo" />
          </div>
          <h3>CRR城市定向</h3>
          <p>探索城市，发现精彩</p>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { Phone, Message, User, Lock, Trophy, Star, Location } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  consent: false
})

const registerRules = {
  username: [
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// 注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    // 检查同意条款
    if (!registerForm.consent) {
      ElMessage.error('请先同意用户协议')
      return
    }
    
    await registerFormRef.value.validate()
    loading.value = true
    
    // 构建注册数据
    const registerData = {
      phone: registerForm.phone,
      password: registerForm.password,
      email: registerForm.email || undefined
    }
    
    // 可选字段
    if (registerForm.username) {
      registerData.username = registerForm.username
    }
    
    await userStore.registerUser(registerData)
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

.consent-section {
  margin: 20px 0;
}

.consent-checkbox {
  font-size: 14px;
  color: #606266;
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
