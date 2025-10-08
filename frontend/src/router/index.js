import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', hideHeader: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', hideHeader: true }
  },
  {
    path: '/lottery',
    name: 'Lottery',
    component: () => import('@/views/Lottery.vue'),
    meta: { title: '抽签', requiresAuth: true }
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('@/views/Ranking.vue'),
    meta: { title: '排行榜' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
    // 活动中心路由
    {
      path: '/activity-center',
      name: 'ActivityCenter',
      component: () => import('@/views/ActivityCenter.vue'),
      meta: { title: '活动中心', requiresAuth: true }
    },
    {
      path: '/activity/:id',
      name: 'ActivityDetail',
      component: () => import('@/views/ActivityDetail.vue'),
      meta: { title: '活动详情', requiresAuth: true }
    },
    {
      path: '/activity/:id/tasks',
      name: 'TaskManagement',
      component: () => import('@/views/TaskManagement.vue'),
      meta: { title: '任务管理', requiresAuth: true }
    },
    {
      path: '/create-team',
      name: 'CreateTeam',
      component: () => import('@/views/CreateTeam.vue'),
      meta: { title: '创建队伍', requiresAuth: true }
    },
  // 管理员路由
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { title: '管理后台', requiresAdmin: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '仪表盘', requiresAdmin: true }
      },
      {
        path: 'lottery',
        name: 'AdminLottery',
        component: () => import('@/views/admin/Lottery.vue'),
        meta: { title: '抽签管理', requiresAdmin: true }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理', requiresAdmin: true }
      },
      {
        path: 'tasks',
        name: 'AdminTasks',
        component: () => import('@/views/admin/Tasks.vue'),
        meta: { title: '任务管理', requiresAdmin: true }
      },
      {
        path: 'team-progress',
        name: 'AdminTeamProgress',
        component: () => import('@/views/admin/TeamProgress.vue'),
        meta: { title: '队伍进度', requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 动态导入adminStore（避免循环依赖）
  const { useAdminStore } = await import('@/store/admin')
  const adminStore = useAdminStore()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 答题抽签互动网站` : '答题抽签互动网站'
  
  // 管理员路由处理
  if (to.path.startsWith('/admin')) {
    if (to.meta.requiresAdmin && !adminStore.isLoggedIn) {
      next('/login')
      return
    }
    
    // 如果有token但没有管理员信息，尝试获取
    if (adminStore.token && !adminStore.admin) {
      try {
        await adminStore.fetchAdminInfo()
      } catch (error) {
        console.error('获取管理员信息失败:', error)
        adminStore.logout()
        next('/login')
        return
      }
    }
    
    next()
    return
  }
  
  // 用户路由处理
  // 如果有token但没有用户信息，尝试获取用户信息
  if (userStore.token && !userStore.user) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果获取失败，清除token
      userStore.logout()
    }
  }
  
  // 检查是否需要登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router


