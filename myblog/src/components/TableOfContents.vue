<template>
  <div class="toc-container">
    <div class="toc-header">
      <h3>目录</h3>
    </div>
    <nav class="toc-nav">
      <ul class="toc-list" v-if="tocItems.length > 0">
        <li
          v-for="item in tocItems"
          :key="item.id"
          :class="['toc-item', `toc-level-${item.level}`, { active: activeId === item.id }]"
        >
          <button type="button" @click.stop="handleTocClick(item.id)" class="toc-link">
            {{ item.text }}
          </button>
        </li>
      </ul>
      <div v-else class="toc-empty">
        <p class="empty-text">本文暂无目录结构</p>
        <p class="empty-hint">文章内容较为简洁</p>
      </div>
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
let mutationObserver: MutationObserver | null = null

// 简易防抖
const debounce = (fn: (...args: any[]) => void, delay = 200) => {
  let timer: number | null = null
  return (...args: any[]) => {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => fn(...args), delay)
  }
}

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

// 处理目录点击
const handleTocClick = (id: string) => {
  const element = document.getElementById(id)
  if (!element) return

  // 立即更新 activeId，确保 UI 立即响应
  activeId.value = id

  // 使用 scrollIntoView 配合 CSS scroll-margin-top，避免手动计算偏移
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 设置交叉观察器 - 用于自动更新当前位置
const teardownIntersectionObserver = () => {
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
}

const setupIntersectionObserver = () => {
  const headingElements = tocItems.value
    .map((item) => document.getElementById(item.id))
    .filter((el): el is HTMLElement => el !== null)

  if (headingElements.length === 0) return

  teardownIntersectionObserver()

  observer.value = new IntersectionObserver(
    (entries) => {
      // 找到第一个进入视口的元素
      const visibleEntries = entries.filter((entry) => entry.isIntersecting)
      if (visibleEntries.length > 0) {
        // 选择最上面的可见元素
        const topEntry = visibleEntries.reduce((top, current) => {
          return current.boundingClientRect.top < top.boundingClientRect.top ? current : top
        })
        activeId.value = topEntry.target.id
      }
    },
    {
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0.1,
    },
  )

  headingElements.forEach((element) => {
    if (element) observer.value?.observe(element)
  })
}

// 观察文章内容变化
const observeContentChanges = () => {
  const selector = props.contentSelector || '.article-content'
  let contentElement = document.querySelector(selector)

  if (!contentElement) {
    // 监听 body，等待内容元素出现后再切换到精确监听
    if (mutationObserver) {
      mutationObserver.disconnect()
      mutationObserver = null
    }

    const debouncedRefresh = debounce(async () => {
      generateToc()
      await nextTick()
      setupIntersectionObserver()
    }, 300)

    const debouncedInitWhenReady = debounce(async () => {
      const el = document.querySelector(selector)
      if (el) {
        // 先断开对 body 的监听
        if (mutationObserver) {
          mutationObserver.disconnect()
          mutationObserver = null
        }
        // 生成目录并设置针对内容的监听
        generateToc()
        await nextTick()
        setupIntersectionObserver()
        // 切换到对内容元素的观察
        mutationObserver = new MutationObserver(() => debouncedRefresh())
        mutationObserver.observe(el, { childList: true, subtree: true })
      }
    }, 100)

    mutationObserver = new MutationObserver(() => debouncedInitWhenReady())
    mutationObserver.observe(document.body, { childList: true, subtree: true })
    return
  }

  // 找到了内容元素，直接对内容元素进行监听
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }

  const debouncedRefresh = debounce(async () => {
    generateToc()
    await nextTick()
    setupIntersectionObserver()
  }, 300)

  mutationObserver = new MutationObserver(() => debouncedRefresh())
  mutationObserver.observe(contentElement, { childList: true, subtree: true })
}

// 初始化
const init = async () => {
  // 等待 DOM 更新
  await nextTick()

  // 生成目录
  generateToc()

  // 再次等待
  await nextTick()

  // 设置观察器
  setupIntersectionObserver()

  // 观察内容变化
  observeContentChanges()
}

onMounted(() => {
  // 延迟初始化，确保内容已渲染
  setTimeout(() => {
    init()
  }, 150)
})

onUnmounted(() => {
  teardownIntersectionObserver()
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
})

// 暴露方法供父组件调用
defineExpose({
  refresh: init,
})
</script>

<style scoped>
/* Theme variables for easy tuning */
.toc-container {
  /* keep layout and positioning unchanged */
  background: transparent;
  box-shadow: none;
  border-radius: 8px;
  padding: 0;
  position: sticky;
  top: 100px;
  height: 250px;
  /* prevent horizontal scrollbar and reserve gutter to avoid layout jitter */
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
  overscroll-behavior: contain;

  /* design tokens */
  --toc-accent: var(--el-color-primary, #409eff);
  --toc-text: var(--el-text-color-primary, #303133);
  --toc-muted: var(--el-text-color-secondary, #909399);
  --toc-hover-bg: color-mix(in srgb, var(--toc-accent) 10%, transparent);
  --toc-active-bg: color-mix(in srgb, var(--toc-accent) 14%, transparent);
  --toc-border: var(--el-border-color-light, #ebeef5);
}

/* Fancy header with subtle underline animation */
.toc-header {
  margin: 0 0 14px 0;
  padding: 0 0 10px 0;
  border-bottom: 1px dashed var(--toc-border);
}

.toc-header h3 {
  position: relative;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--toc-text);
}

.toc-header h3::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -12px;
  width: 46px;
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(
    90deg,
    var(--toc-accent),
    color-mix(in srgb, var(--toc-accent) 40%, #7ee787)
  );
  transform-origin: left;
  transform: scaleX(0.85);
  transition: transform 0.3s ease;
}

.toc-header:hover h3::after {
  transform: scaleX(1);
}

.toc-nav {
  font-size: 14px;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* list item baseline with separator rhythm */
.toc-item {
  position: relative;
  margin: 0;
  line-height: 1.55;
}

/* clickable row */
.toc-link {
  position: relative;
  display: block;
  width: 100%;
  padding: 7px 10px 7px 12px;
  color: var(--toc-muted);
  text-align: left;
  background: transparent;
  border: 0;
  outline: none;
  text-decoration: none;
  border-left: 2px solid transparent;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-left-color 0.2s ease,
    transform 0.2s ease;
  word-break: break-word;
  cursor: pointer;
  border-radius: 6px;
}

/* bullet dot */
.toc-link::before {
  content: '';
  position: absolute;
  left: 6px; /* follows padding-left indentation per level */
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--toc-accent) 86%, #fff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--toc-accent) 28%, transparent);
  transform: translateY(-50%) scale(0.5);
  opacity: 0;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.toc-link:hover {
  color: color-mix(in srgb, var(--toc-accent) 86%, #1e1e1e);
  background: var(--toc-hover-bg);
  border-left-color: var(--toc-accent);
  transform: translateX(2px);
}

.toc-link:hover::before {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}

/* active state */
.toc-item.active .toc-link {
  color: color-mix(in srgb, var(--toc-accent) 96%, #111);
  background: var(--toc-active-bg);
  border-left-color: var(--toc-accent);
  font-weight: 600;
  box-shadow: 0 2px 10px color-mix(in srgb, var(--toc-accent) 16%, transparent);
}

.toc-item.active .toc-link::before {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}

/* focus visible for keyboard users */
.toc-link:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--toc-accent) 55%, #fff);
  outline-offset: 2px;
}

/* Levels indentation (keep structure) */
.toc-level-1 .toc-link {
  padding-left: 12px;
  font-weight: 600;
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

/* Empty state */
.toc-empty {
  text-align: center;
  padding: 20px 0;
  color: var(--toc-muted);
}
.empty-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--toc-text);
  opacity: 0.8;
}
.empty-hint {
  margin: 0;
  font-size: 12px;
  color: var(--toc-muted);
  font-style: italic;
}

/* Prevent horizontal overflow and scrollbar flicker */
.toc-nav,
.toc-list,
.toc-link {
  max-width: 100%;
  box-sizing: border-box;
}
.toc-link {
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}
.toc-container {
  -webkit-overflow-scrolling: touch;
}

/* Subtle entrance animation */
@keyframes toc-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.toc-item {
  animation: toc-fade-in 0.25s ease both;
}

/* Polished thin scrollbar */
.toc-container::-webkit-scrollbar {
  width: 6px;
}
.toc-container::-webkit-scrollbar-track {
  background: transparent;
}
.toc-container::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--toc-accent) 24%, #888);
  border-radius: 6px;
}
.toc-container:hover::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--toc-accent) 44%, #666);
}

/* Responsive: keep hidden on small screens */
@media (max-width: 1200px) {
  .toc-container {
    display: none;
  }
}

/* Dark scheme tweaks */
:global(.dark) .toc-link {
  color: #b5b5b5;
}
:global(.dark) .toc-item.active .toc-link {
  box-shadow: 0 2px 10px color-mix(in srgb, var(--toc-accent) 28%, #000);
}
</style>
