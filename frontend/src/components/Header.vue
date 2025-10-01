<template>
  <div class="header">
    <div class="header-content">
      <div class="logo">
        <el-icon><Trophy /></el-icon>
        <span>CRR定向</span>
      </div>
      
      <div class="nav-menu">
        <el-menu
          :default-active="activeIndex"
          mode="horizontal"
          @select="handleSelect"
          class="nav-menu-item"
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/quiz" v-if="isLoggedIn">答题</el-menu-item>
          <el-menu-item index="/lottery" v-if="isLoggedIn">抽签</el-menu-item>
          <el-menu-item index="/task-center" v-if="isLoggedIn">任务中心</el-menu-item>
          <el-menu-item index="/ranking">排行榜</el-menu-item>
        </el-menu>
      </div>
      
      <div class="user-actions">
        <template v-if="isLoggedIn">
          <el-dropdown @command="handleUserCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="user?.avatar">
                {{ user?.nickname?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ user?.nickname || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button type="primary" @click="$router.push('/login')">登录</el-button>
          <el-button @click="$router.push('/register')">注册</el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeIndex = computed(() => route.path)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const user = computed(() => userStore.user)

const handleSelect = (key) => {
  router.push(key)
}

const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/')
      break
  }
}
</script>

<style scoped>
.header {
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
}

.logo .el-icon {
  margin-right: 8px;
  font-size: 24px;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-menu-item {
  border-bottom: none;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  margin: 0 8px;
  font-size: 14px;
}
</style>
