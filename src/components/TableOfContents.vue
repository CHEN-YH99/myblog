<template>
  <div class="toc-container" v-if="tocItems.length > 0">
    <div class="toc-header">
      <h3>目录</h3>
    </div>
    <nav class="toc-nav">
      <ul class="toc-list">
        <li 
          v-for="item in tocItems" 
          :key="item.id"
          :class="[
            'toc-item',
            `toc-level-${item.level}`,
            { 'active': activeId === item.id }
          ]"
        >
          <a 
            :href="`#${item.id}`" 
            @click.prevent="scrollToHeading(item.id)"
            class="toc-link"
          >
            {{ item.text }}
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

interface TocItem {
  id: string
  text: string
  level: number
}

const props = defineProps<{
  contentSelector?: string
}>()

const tocItems = ref<TocItem[]>([])
const activeId = ref<string>('')
const observer = ref<IntersectionObserver | null>(null)

// 生成目录
const generateToc = () => {
  const contentElement = document.querySelector(props.contentSelector || '.article-content')
  if (!contentElement) return

  const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const items: TocItem[] = []

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1))
    const text = heading.textContent?.trim() || ''
    const id = heading.id || `heading-${index}`
    
    // 如果标题没有id，添加一个
    if (!heading.id) {
      heading.id = id
    }

    items.push({ id, text, level })
  })

  tocItems.value = items
}

// 滚动到指定标题
const scrollToHeading = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    const offsetTop = element.offsetTop - 80 // 考虑固定头部的高度
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    })
  }
}

// 设置交叉观察器
const setupIntersectionObserver = () => {
  const headingElements = tocItems.value.map(item => document.getElementById(item.id)).filter(Boolean)
  
  if (headingElements.length === 0) return

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      })
    },
    {
      rootMargin: '-80px 0px -80% 0px', // 调整触发区域
      threshold: 0.1
    }
  )

  headingElements.forEach((element) => {
    if (element) observer.value?.observe(element)
  })
}

// 初始化
const init = async () => {
  await nextTick()
  generateToc()
  if (tocItems.value.length > 0) {
    setupIntersectionObserver()
  }
}

onMounted(() => {
  // 延迟初始化，确保内容已渲染
  setTimeout(init, 100)
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})

// 暴露方法供父组件调用
defineExpose({
  refresh: init
})
</script>

<style scoped>
.toc-container {
  background: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 20px;
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toc-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.toc-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.toc-nav {
  font-size: 14px;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-item {
  margin: 0;
  line-height: 1.6;
}

.toc-link {
  display: block;
  padding: 6px 0;
  color: #666;
  text-decoration: none;
  border-left: 3px solid transparent;
  padding-left: 12px;
  transition: all 0.2s ease;
  word-break: break-word;
}

.toc-link:hover {
  color: #409eff;
  background-color: #f8f9fa;
}

.toc-item.active .toc-link {
  color: #409eff;
  border-left-color: #409eff;
  background-color: #f0f8ff;
  font-weight: 500;
}

/* 不同级别标题的缩进 */
.toc-level-1 .toc-link {
  padding-left: 12px;
  font-weight: 500;
}

.toc-level-2 .toc-link {
  padding-left: 24px;
}

.toc-level-3 .toc-link {
  padding-left: 36px;
}

.toc-level-4 .toc-link {
  padding-left: 48px;
}

.toc-level-5 .toc-link {
  padding-left: 60px;
}

.toc-level-6 .toc-link {
  padding-left: 72px;
}

/* 滚动条样式 */
.toc-container::-webkit-scrollbar {
  width: 4px;
}

.toc-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.toc-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.toc-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .toc-container {
    display: none;
  }
}
</style>