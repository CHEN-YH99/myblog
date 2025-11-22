/**
 * 性能优化相关工具函数
 */

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 图片懒加载
export function lazyLoadImage(img: HTMLImageElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement
          image.src = src
          image.onload = () => {
            image.classList.add('loaded')
            observer.unobserve(image)
            resolve()
          }
          image.onerror = () => {
            observer.unobserve(image)
            reject(new Error('Image load failed'))
          }
        }
      })
    })
    
    observer.observe(img)
  })
}

// 组件懒加载
export function lazyLoadComponent(
  importFunc: () => Promise<any>,
  delay = 200
): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(importFunc())
    }, delay)
  })
}

// 内存优化：清理定时器
export class TimerManager {
  private timers: Set<NodeJS.Timeout> = new Set()
  private intervals: Set<NodeJS.Timeout> = new Set()
  
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      callback()
      this.timers.delete(timer)
    }, delay)
    this.timers.add(timer)
    return timer
  }
  
  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay)
    this.intervals.add(interval)
    return interval
  }
  
  clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer)
    this.timers.delete(timer)
  }
  
  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval)
    this.intervals.delete(interval)
  }
  
  clearAll(): void {
    this.timers.forEach(timer => clearTimeout(timer))
    this.intervals.forEach(interval => clearInterval(interval))
    this.timers.clear()
    this.intervals.clear()
  }
}

// 虚拟滚动优化
export class VirtualScroll {
  private container: HTMLElement
  private itemHeight: number
  private visibleCount: number
  private startIndex = 0
  private endIndex = 0
  
  constructor(container: HTMLElement, itemHeight: number, visibleCount: number) {
    this.container = container
    this.itemHeight = itemHeight
    this.visibleCount = visibleCount
  }
  
  getVisibleRange(scrollTop: number): { start: number; end: number } {
    this.startIndex = Math.floor(scrollTop / this.itemHeight)
    this.endIndex = Math.min(
      this.startIndex + this.visibleCount,
      this.getTotalCount()
    )
    
    return {
      start: this.startIndex,
      end: this.endIndex
    }
  }
  
  private getTotalCount(): number {
    // 这里应该返回总数据量，由使用者实现
    return 0
  }
}

// 性能监控
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }
  
  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark)
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`)
      return 0
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.log(`${name}: ${duration.toFixed(2)}ms`)
    return duration
  }
  
  measureAndClear(name: string, startMark: string): number {
    const duration = this.measure(name, startMark)
    this.marks.delete(startMark)
    return duration
  }
  
  clear(): void {
    this.marks.clear()
  }
}

// 内存使用监控
export function getMemoryUsage(): any {
  if ('memory' in performance) {
    return {
      used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
      total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
      limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)
    }
  }
  return null
}

// 首屏加载时间计算
export function getFirstContentfulPaint(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          resolve(fcpEntry.startTime)
          observer.disconnect()
        }
      })
      observer.observe({ entryTypes: ['paint'] })
    } else if (typeof window !== 'undefined') {
      // 降级方案
      (window as any).addEventListener('load', () => {
        resolve(performance.now())
      })
    } else {
      // 服务端渲染环境
      resolve(0)
    }
  })
}

// 资源预加载
export function preloadResource(url: string, type: 'script' | 'style' | 'image' = 'script'): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    
    switch (type) {
      case 'script':
        link.as = 'script'
        break
      case 'style':
        link.as = 'style'
        break
      case 'image':
        link.as = 'image'
        break
    }
    
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Failed to preload ${url}`))
    
    document.head.appendChild(link)
  })
}

// 代码分割辅助函数
export function createAsyncComponent<T>(
  loader: () => Promise<T>,
  options: {
    delay?: number
    timeout?: number
    errorComponent?: any
    loadingComponent?: any
  } = {}
) {
  const {
    delay = 200,
    timeout = 10000,
    errorComponent = null,
    loadingComponent = null
  } = options
  
  return {
    loader,
    delay,
    timeout,
    errorComponent,
    loadingComponent
  }
}

// 批量处理优化
export function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize = 10,
  delay = 0
): Promise<R[]> {
  return new Promise((resolve) => {
    const results: R[] = []
    let currentIndex = 0
    
    function processBatch() {
      const endIndex = Math.min(currentIndex + batchSize, items.length)
      
      for (let i = currentIndex; i < endIndex; i++) {
        results.push(processor(items[i]))
      }
      
      currentIndex = endIndex
      
      if (currentIndex < items.length) {
        setTimeout(processBatch, delay)
      } else {
        resolve(results)
      }
    }
    
    processBatch()
  })
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()
export const timerManager = new TimerManager()