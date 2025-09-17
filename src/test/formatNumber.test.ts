/**
 * formatNumber 函数测试用例
 * 
 * 测试各种数字格式化场景
 */

import { formatNumber } from '../utils/format'

// 测试用例
console.log('=== formatNumber 测试用例 ===')

// 基础数字测试
console.log('0 =>', formatNumber(0))           // 0
console.log('123 =>', formatNumber(123))       // 123
console.log('999 =>', formatNumber(999))       // 999

// 千位测试 (k)
console.log('1000 =>', formatNumber(1000))     // 1k
console.log('1234 =>', formatNumber(1234))     // 1.2k
console.log('5600 =>', formatNumber(5600))     // 5.6k
console.log('9999 =>', formatNumber(9999))     // 10k

// 万位测试 (w)
console.log('10000 =>', formatNumber(10000))   // 1w
console.log('12345 =>', formatNumber(12345))   // 1.2w
console.log('56000 =>', formatNumber(56000))   // 5.6w
console.log('999999 =>', formatNumber(999999)) // 100w

// 亿位测试
console.log('100000000 =>', formatNumber(100000000))  // 1亿
console.log('123456789 =>', formatNumber(123456789))  // 1.2亿
console.log('567000000 =>', formatNumber(567000000))  // 5.7亿

// 负数测试
console.log('-1234 =>', formatNumber(-1234))   // -1.2k
console.log('-12345 =>', formatNumber(-12345)) // -1.2w

// 边界值测试
console.log('NaN =>', formatNumber(NaN))       // 0
console.log('Infinity =>', formatNumber(Infinity)) // 处理无穷大

console.log('=== 测试完成 ===')

export {}