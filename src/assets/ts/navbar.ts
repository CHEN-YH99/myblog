import { ref } from 'vue'

// 滚动事件
	const lastScrollTop = ref(0)  // 记录上一次滚动位置
	const scrollDirection = ref('') // 记录滚动方向
	const scrollDown = ref(false)  // 向下滚动触发
	const scrollUp = ref(false)  // 向上滚动触发
  const isHidden = ref(false)  // 是否隐藏导航栏
  let ticking = false // 防抖处理
	// 监听滚动事件
	const handleScroll = () => {
    // 防抖处理，防止频繁触发
		if(!ticking) {
      requestAnimationFrame(() => {
        getScrollDirection()
        ticking = false
      })
      ticking = true
    }
    // 获取滚动方向
    function getScrollDirection() { 
       const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
		
	
		
    if (scrollPosition > lastScrollTop.value) {
      scrollDirection.value = 'down'
      scrollDown.value = true
			scrollUp.value = false
      isHidden.value = true

    } else {
			scrollDirection.value = 'up'
      scrollDown.value = false
			scrollUp.value = true
      isHidden.value = false
    }
		lastScrollTop.value = scrollPosition
	  }
  }
	 
// 初始化滚动监听
export const initScrollListener = () => {
  document.body.addEventListener('scroll', handleScroll, { passive: true })
}

// 移除滚动监听
export const removeScrollListener = () => {
  document.body.removeEventListener('scroll', handleScroll)
}

export {
  scrollDirection,
  scrollDown,
  scrollUp,
  isHidden,
  handleScroll
}