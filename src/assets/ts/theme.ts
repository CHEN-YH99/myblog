import { useDark, useToggle } from '@vueuse/core'; // 导入主题色切换函数
//主题色切换
  const isDark = useDark();  // 检测当前是否为深色模式
  const toggleDark = useToggle(isDark);  // 用于切换深色和浅色模式

  export {
    isDark,
    toggleDark
  }