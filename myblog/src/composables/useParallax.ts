import { onMounted, onUnmounted, Ref } from 'vue';

export interface ParallaxOptions {
  speed?: number; // 视差移动速度
  scale?: boolean; // 是否启用缩放效果
  opacity?: boolean; // 是否启用透明度淡出效果
}

export function useParallax(target: Ref<HTMLElement | null>, options: ParallaxOptions | number = 0.5) {
  const opts = typeof options === 'number' ? { speed: options } : options;
  const speed = opts.speed ?? 0.5;
  const enableScale = opts.scale ?? false;
  const enableOpacity = opts.opacity ?? false;

  const handleScroll = () => {
    if (!target.value) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    
    // 只在首屏范围内应用视差，减少性能消耗
    if (scrollTop > viewportHeight) return;
    
    // 视差位移
    const yPos = scrollTop * speed;
    let transform = `translate3d(0, ${yPos}px, 0)`;
    
    // 缩放效果 (向后缩小)
    if (enableScale) {
      // 滚动到视口高度时缩小到 0.8
      const scale = Math.max(0.8, 1 - (scrollTop / viewportHeight) * 0.2);
      transform += ` scale(${scale})`;
    }
    
    target.value.style.transform = transform;
    
    // 透明度淡出效果
    if (enableOpacity) {
      // 滚动到视口高度的一半时完全透明
      const opacity = Math.max(0, 1 - (scrollTop / (viewportHeight * 0.8)));
      target.value.style.opacity = opacity.toString();
    }
  };

  let rafId: number;
  const tick = () => {
    handleScroll();
    rafId = requestAnimationFrame(tick);
  };

  onMounted(() => {
    // 使用 rAF 保证流畅度
    rafId = requestAnimationFrame(tick);
  });

  onUnmounted(() => {
    cancelAnimationFrame(rafId);
  });
}
