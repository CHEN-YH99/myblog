import { ref } from 'vue'

// 滚动事件
const lastScrollTop = ref(0)  // 记录上一次滚动位置
const scrollDirection = ref('') // 记录滚动方向
const scrollDown = ref(false)  // 向下滚动触发
const scrollUp = ref(false)  // 向上滚动触发

// 监听滚动事件
const handleScroll = () => {
  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
  console.log("滚动条距离顶部位置:", scrollPosition)

  if (scrollPosition > lastScrollTop.value) {
    scrollDirection.value = 'down'
    scrollDown.value = true
    scrollUp.value = false
    console.log("向下滚动");
  } else {
    scrollDirection.value = 'up'
    scrollDown.value = false
    scrollUp.value = true
    console.log("向上滚动");
  }
  lastScrollTop.value = scrollPosition
}

export { lastScrollTop, scrollDirection, scrollDown, scrollUp, handleScroll }
