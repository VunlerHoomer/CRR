<template>
  <div class="lazy-image-container" :style="{ width, height }">
    <img
      v-if="loaded"
      :src="src"
      :alt="alt"
      :class="['lazy-image', { 'fade-in': loaded }]"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-else class="lazy-image-placeholder" :class="{ 'loading': loading }">
      <el-icon v-if="loading" class="loading-icon">
        <Loading />
      </el-icon>
      <span v-else-if="error" class="error-text">加载失败</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '200px'
  },
  threshold: {
    type: Number,
    default: 0.1
  }
})

const loaded = ref(false)
const loading = ref(false)
const error = ref(false)
const observer = ref(null)

const handleLoad = () => {
  loaded.value = true
  loading.value = false
}

const handleError = () => {
  error.value = true
  loading.value = false
}

const loadImage = () => {
  if (loading.value || loaded.value) return
  
  loading.value = true
  error.value = false
  
  const img = new Image()
  img.onload = () => {
    loaded.value = true
    loading.value = false
  }
  img.onerror = () => {
    error.value = true
    loading.value = false
  }
  img.src = props.src
}

onMounted(() => {
  // 使用 Intersection Observer 实现懒加载
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage()
          observer.value?.unobserve(entry.target)
        }
      })
    },
    {
      threshold: props.threshold
    }
  )
  
  observer.value.observe(document.querySelector('.lazy-image-container'))
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image.fade-in {
  opacity: 1;
}

.lazy-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #999;
}

.lazy-image-placeholder.loading {
  background: linear-gradient(90deg, #f5f5f5 25%, #e0e0e0 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.loading-icon {
  font-size: 24px;
  color: #409eff;
  animation: spin 1s linear infinite;
}

.error-text {
  font-size: 14px;
  color: #f56c6c;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
