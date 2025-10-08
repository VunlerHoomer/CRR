<template>
  <div class="register-page">
    <div class="register-container">
      <div class="form-header">
        <h1>创建账户</h1>
        <p>填写信息完成注册</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <div class="form-item">
          <label class="form-label">* 用户名</label>
          <div class="input-line"></div>
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            class="custom-input"
          />
        </div>

        <div class="form-item">
          <label class="form-label">* 密码</label>
          <div class="input-line"></div>
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            class="custom-input"
            show-password
          />
        </div>

        <div class="form-item">
          <label class="form-label">* 确认密码</label>
          <div class="input-line"></div>
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            class="custom-input"
            show-password
          />
        </div>

        <div class="form-item">
          <label class="form-label">邮箱</label>
          <div class="input-line"></div>
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱 (可选)"
            class="custom-input"
          />
        </div>

        <div class="form-item">
          <label class="form-label">昵称</label>
          <div class="input-line"></div>
          <el-input
            v-model="registerForm.nickname"
            placeholder="请输入昵称 (可选)"
            class="custom-input"
          />
        </div>

        <div class="form-item">
          <label class="form-label">手机号</label>
          <div class="input-line"></div>
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号 (可选)"
            class="custom-input"
          />
        </div>

        <div class="privacy-notice">
          <p>手机号、邮箱并非强制填写。若您填写,手机号将仅用于登录、密码找回,邮箱仅用于获取基于邮箱的头像。</p>
        </div>

        <div class="consent-section">
          <el-checkbox v-model="registerForm.consent" class="consent-checkbox">
            我同意旦旦城定收集上述数据并用于上述用途
          </el-checkbox>
        </div>

        <el-button
          type="primary"
          class="register-button"
          :loading="loading"
          @click="handleRegister"
        >
          注册并登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  nickname: '',
  phone: '',
  consent: false
})

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
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
  ],
  nickname: [
    { max: 20, message: '昵称长度不能超过20个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
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
      username: registerForm.username,
      password: registerForm.password,
      email: registerForm.email || undefined,
      nickname: registerForm.nickname || undefined,
      phone: registerForm.phone || undefined
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
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  max-width: 400px;
  width: 100%;
  padding: 40px;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h1 {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.form-header p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.register-form {
  width: 100%;
}

.form-item {
  margin-bottom: 30px;
}

.form-label {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.input-line {
  width: 100%;
  height: 1px;
  background-color: #ddd;
  margin-bottom: 8px;
}

.custom-input {
  width: 100%;
}

.custom-input :deep(.el-input__wrapper) {
  border: none;
  box-shadow: none;
  padding: 8px 0;
  font-size: 16px;
}

.custom-input :deep(.el-input__inner) {
  padding: 0;
  border: none;
  font-size: 16px;
  color: #333;
}

.custom-input :deep(.el-input__inner::placeholder) {
  color: #999;
}

.privacy-notice {
  margin: 30px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.privacy-notice p {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.consent-section {
  margin: 30px 0;
}

.consent-checkbox {
  font-size: 14px;
  color: #666;
}

.consent-checkbox :deep(.el-checkbox__label) {
  font-size: 14px;
  color: #666;
}

.register-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  border: none;
  border-radius: 8px;
  margin-top: 20px;
}

.register-button:hover {
  background: linear-gradient(135deg, #ff5252 0%, #ff7043 100%);
}

.register-button:focus {
  background: linear-gradient(135deg, #ff5252 0%, #ff7043 100%);
}

@media (max-width: 480px) {
  .register-container {
    padding: 20px;
  }
  
  .form-header h1 {
    font-size: 24px;
  }
  
  .form-header p {
    font-size: 14px;
  }
}
</style>
