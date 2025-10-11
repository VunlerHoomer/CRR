<template>
  <el-container class="admin-layout">
    <el-aside width="200px" class="admin-sidebar">
      <div class="sidebar-header">
        <h3>管理后台</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/admin/lottery">
          <el-icon><Present /></el-icon>
          <span>抽签管理</span>
        </el-menu-item>
                <el-menu-item index="/admin/users">
                  <el-icon><User /></el-icon>
                  <span>用户管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/registration">
                  <el-icon><Document /></el-icon>
                  <span>报名管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/area">
                  <el-icon><Location /></el-icon>
                  <span>区域管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/task">
                  <el-icon><List /></el-icon>
                  <span>任务管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/activity">
                  <el-icon><Calendar /></el-icon>
                  <span>活动管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/team-progress">
                  <el-icon><Trophy /></el-icon>
                  <span>队伍进度</span>
                </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="admin-info">
              <el-avatar :size="32">{{ getAvatarText(adminStore.admin) || 'A' }}</el-avatar>
              <span class="admin-name">{{ adminStore.admin?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="home">返回首页</el-dropdown-item>
                <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/store/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAvatarText } from '@/utils/avatar'
import { DataAnalysis, Edit, Present, User, ArrowDown, Document, List, Trophy, Location, Calendar } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '管理后台')

const handleCommand = async (command) => {
  switch (command) {
    case 'home':
      router.push('/')
      break
    case 'changePassword':
      ElMessageBox.prompt('请输入新密码', '修改密码', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'password',
        inputPattern: /.{6,}/,
        inputErrorMessage: '密码至少6位'
      }).then(({ value }) => {
        ElMessage.success('密码修改功能开发中')
      }).catch(() => {})
      break
    case 'logout':
      adminStore.logout()
      ElMessage.success('已退出登录')
      router.push('/admin/login')
      break
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-sidebar {
  background: #001529;
  color: white;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.sidebar-menu {
  border-right: none;
  background: #001529;
}

.sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  color: white;
  background: #1890ff;
}

.admin-header {
  background: white;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.admin-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.admin-info:hover {
  background-color: #f5f7fa;
}

.admin-name {
  margin: 0 8px;
  font-size: 14px;
}

.admin-main {
  background: #f5f7fa;
  padding: 20px;
}
</style>
