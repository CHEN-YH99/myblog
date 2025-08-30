import { useDark, useToggle } from '@vueuse/core'; // 导入主题色切换函数
//主题色切换
  const is_Dark = useDark({ storageKey:'app_dark'});  // 检测当前是否为深色模式
  const toggleDark = useToggle(is_Dark);  // 用于切换深色和浅色模式

// 记录点击位置，存入 CSS 变量，作为圆形遮罩的圆心
  const rememberPointer = (e?: MouseEvent) => {
    // 无事件时（键盘切换），给个默认圆心：右上角略内缩
    const x = e?.clientX ?? (window.innerWidth - 24)
    const y = e?.clientY ?? 24
    const root = document.documentElement
    root.style.setProperty('--vt-x', `${x}px`)
    root.style.setProperty('--vt-y', `${y}px`)
  }

  // 用 View Transition 包裹主题切换；不支持时回退为直接切换
  const animateThemeSwitch = (next: boolean) => {
    const apply = () => {
      is_Dark.value = next
    }
    const startVT = (document as any).startViewTransition?.bind(document)
    if (startVT) startVT(apply)
    else apply()
  }


  export {
    is_Dark,
    toggleDark,
    rememberPointer,

    animateThemeSwitch
  }