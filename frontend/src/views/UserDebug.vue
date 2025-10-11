<template>
  <div class="user-debug">
    <h1>用户调试页面</h1>
    
    <div class="debug-section">
      <h2>用户登录状态</h2>
      <p>是否已登录: {{ userStore.isLoggedIn ? '是' : '否' }}</p>
      <p>Token: {{ userStore.token || '无' }}</p>
    </div>
    
    <div class="debug-section">
      <h2>用户信息</h2>
      <pre>{{ JSON.stringify(userStore.user, null, 2) }}</pre>
    </div>
    
    <div class="debug-section">
      <h2>用户ID字段</h2>
      <p>id: {{ userStore.user?.id || '无' }}</p>
      <p>_id: {{ userStore.user?._id || '无' }}</p>
      <p>userId: {{ userStore.user?.userId || '无' }}</p>
    </div>
    
    <div class="debug-section">
      <h2>API测试</h2>
      <button @click="testAreasAPI">测试区域API</button>
      <div v-if="apiResult">
        <h3>API结果:</h3>
        <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/user'
import { getActivityAreas } from '@/api/task'

const userStore = useUserStore()
const apiResult = ref(null)

const testAreasAPI = async () => {
  try {
    const userId = userStore.user?.id || userStore.user?._id || userStore.user?.userId
    console.log('测试API，用户ID:', userId)
    const response = await getActivityAreas('68e65f6b93917ac95df6a897', userId)
    apiResult.value = response
  } catch (error) {
    apiResult.value = { error: error.message }
  }
}
</script>

<style scoped>
.user-debug {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.debug-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 3px;
  overflow-x: auto;
}

button {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

button:hover {
  background: #66b1ff;
}
</style>
