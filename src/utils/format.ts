/**
 * 数据格式化相关工具函数
 */

// 数字简化显示（k、w格式）
export function formatNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0'
  }

  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (absNum >= 100000000) {
    // 大于等于1亿，显示为亿
    return sign + (absNum / 100000000).toFixed(1).replace(/\.0$/, '') + '亿'
  } else if (absNum >= 10000) {
    // 大于等于1万，显示为万
    return sign + (absNum / 10000).toFixed(1).replace(/\.0$/, '') + 'w'
  } else if (absNum >= 1000) {
    // 大于等于1千，显示为千
    return sign + (absNum / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  } else {
    // 小于1千，直接显示
    return sign + absNum.toString()
  }
}

// 数字格式化（千位分隔符）
export function commafy(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 时间戳转时间
export function timestampToTime(timestamp: number = Date.now(), isMs: boolean = true): string {
  const date = new Date(isMs ? timestamp : timestamp * 1000)
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

// 移除HTML标签
export function removeHtmlTags(str: string = ''): string {
  return str.replace(/<[^>]*>/g, '')
}