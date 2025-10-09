<template>
  <div id="app">
    <el-container>
      <el-header v-if="showHeader">
        <Header />
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/Header.vue'

const route = useRoute()

const showHeader = computed(() => {
  const hideHeader = route.meta.hideHeader
  console.log('🔍 Header显示检查:', {
    route: route.path,
    hideHeader,
    showHeader: !hideHeader
  })
  return !hideHeader
})
</script>

<style>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.el-header {
  padding: 0;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.el-main {
  padding: 0;
  min-height: calc(100vh - 60px);
}
</style>


