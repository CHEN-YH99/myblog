/**
 * 性能测试工具
 * 用于测试和验证性能优化效果
 */

export interface PerformanceTestResult {
  testName: string
  duration: number
  memoryUsage?: number
  success: boolean
  error?: string
}

export class PerformanceTester {
  private results: PerformanceTestResult[] = []

  /**
   * 测试函数执行时间
   */
  async testExecutionTime<T>(
    testName: string,
    fn: () => Promise<T> | T
  ): Promise<PerformanceTestResult> {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()
    
    try {
      await fn()
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      
      const result: PerformanceTestResult = {
        testName,
        duration: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        success: true
      }
      
      this.results.push(result)
      return result
    } catch (error) {
      const endTime = performance.now()
      const result: PerformanceTestResult = {
        testName,
        duration: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      
      this.results.push(result)
      return result
    }
  }

  /**
   * 测试图片加载性能
   */
  async testImageLoading(imageUrls: string[]): Promise<PerformanceTestResult> {
    return this.testExecutionTime('Image Loading', async () => {
      const promises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = resolve
          img.onerror = reject
          img.src = url
        })
      })
      
      await Promise.all(promises)
    })
  }

  /**
   * 测试防抖函数性能
   */
  testDebounce(fn: Function, delay: number, callCount: number): PerformanceTestResult {
    const startTime = performance.now()
    
    try {
      // 快速调用多次
      for (let i = 0; i < callCount; i++) {
        fn()
      }
      
      const endTime = performance.now()
      
      const result: PerformanceTestResult = {
        testName: `Debounce (${callCount} calls)`,
        duration: endTime - startTime,
        success: true
      }
      
      this.results.push(result)
      return result
    } catch (error) {
      const endTime = performance.now()
      const result: PerformanceTestResult = {
        testName: `Debounce (${callCount} calls)`,
        duration: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      
      this.results.push(result)
      return result
    }
  }

  /**
   * 测试节流函数性能
   */
  testThrottle(fn: Function, interval: number, duration: number): PerformanceTestResult {
    const startTime = performance.now()
    
    try {
      const endTime = startTime + duration
      let callCount = 0
      
      const intervalId = setInterval(() => {
        if (performance.now() >= endTime) {
          clearInterval(intervalId)
          return
        }
        fn()
        callCount++
      }, 10) // 每10ms调用一次
      
      setTimeout(() => {
        clearInterval(intervalId)
        const actualEndTime = performance.now()
        
        const result: PerformanceTestResult = {
          testName: `Throttle (${callCount} calls in ${duration}ms)`,
          duration: actualEndTime - startTime,
          success: true
        }
        
        this.results.push(result)
      }, duration)
      
      return {
        testName: `Throttle (${duration}ms)`,
        duration: 0,
        success: true
      }
    } catch (error) {
      const endTime = performance.now()
      const result: PerformanceTestResult = {
        testName: `Throttle (${duration}ms)`,
        duration: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      
      this.results.push(result)
      return result
    }
  }

  /**
   * 测试虚拟滚动性能
   */
  async testVirtualScroll(itemCount: number, visibleCount: number): Promise<PerformanceTestResult> {
    return this.testExecutionTime('Virtual Scroll', () => {
      // 模拟虚拟滚动计算
      const itemHeight = 50
      const scrollTop = Math.random() * itemCount * itemHeight
      
      const startIndex = Math.floor(scrollTop / itemHeight)
      const endIndex = Math.min(startIndex + visibleCount, itemCount)
      
      // 模拟渲染可见项
      const visibleItems: Array<{index: number, top: number, height: number}> = []
      for (let i = startIndex; i < endIndex; i++) {
        visibleItems.push({
          index: i,
          top: i * itemHeight,
          height: itemHeight
        })
      }
      
      return visibleItems
    })
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  /**
   * 获取所有测试结果
   */
  getResults(): PerformanceTestResult[] {
    return [...this.results]
  }

  /**
   * 清除测试结果
   */
  clearResults(): void {
    this.results = []
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    if (this.results.length === 0) {
      return '暂无测试结果'
    }

    const successCount = this.results.filter(r => r.success).length
    const failureCount = this.results.length - successCount
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length

    let report = `性能测试报告\n`
    report += `================\n`
    report += `总测试数: ${this.results.length}\n`
    report += `成功: ${successCount}\n`
    report += `失败: ${failureCount}\n`
    report += `平均执行时间: ${avgDuration.toFixed(2)}ms\n\n`

    report += `详细结果:\n`
    report += `--------\n`
    
    this.results.forEach((result, index) => {
      report += `${index + 1}. ${result.testName}\n`
      report += `   状态: ${result.success ? '✅ 成功' : '❌ 失败'}\n`
      report += `   执行时间: ${result.duration.toFixed(2)}ms\n`
      
      if (result.memoryUsage !== undefined) {
        report += `   内存变化: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`
      }
      
      if (result.error) {
        report += `   错误: ${result.error}\n`
      }
      
      report += `\n`
    })

    return report
  }
}

// 导出单例实例
export const performanceTester = new PerformanceTester()

// 便捷测试函数
export const runPerformanceTests = async () => {
  console.log('🚀 开始性能测试...')
  
  // 测试防抖
  const debouncedFn = () => console.log('debounced')
  performanceTester.testDebounce(debouncedFn, 300, 10)
  
  // 测试节流
  const throttledFn = () => console.log('throttled')
  performanceTester.testThrottle(throttledFn, 100, 1000)
  
  // 测试虚拟滚动
  await performanceTester.testVirtualScroll(10000, 20)
  
  // 测试图片加载（使用示例图片）
  const testImages = [
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIDE8L3RleHQ+PC9zdmc+'
  ]
  
  await performanceTester.testImageLoading(testImages)
  
  console.log('✅ 性能测试完成')
  console.log(performanceTester.generateReport())
  
  return performanceTester.getResults()
}