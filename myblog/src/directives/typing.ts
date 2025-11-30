import type { Directive } from 'vue'

interface TypingOptions {
  text?: string
  duration?: number // ms, default 2000
}

const typing: Directive<HTMLElement, string | TypingOptions> = {
  mounted(el, binding) {
    startTyping(el, binding.value)
  },
  updated(el, binding) {
    // 仅当值变化或目标文本变化时重放
    const newVal = binding.value
    const oldVal = binding.oldValue
    if (newVal !== oldVal) {
      startTyping(el, newVal)
    }
  },
  beforeUnmount(el: any) {
    if (el.__typing_timer) {
      clearInterval(el.__typing_timer)
      delete el.__typing_timer
    }
  },
}

function startTyping(el: any, value?: string | TypingOptions) {
  if (el.__typing_timer) {
    clearInterval(el.__typing_timer)
    el.__typing_timer = null
  }

  let text = ''
  let duration = 1000

  if (typeof value === 'string') {
    text = value
  } else if (value && typeof value === 'object') {
    text = value.text ?? ''
    if (typeof value.duration === 'number') duration = value.duration
  }

  // 若未显式传入文本，则取当前元素文本
  if (!text) {
    text = (el.getAttribute('data-typing-text') || el.textContent || '').trim()
  }

  // 存储原文，便于后续更新时对比
  el.setAttribute('data-typing-text', text)

  // 空文本时跳过
  if (!text) return

  el.textContent = ''

  const len = [...text].length // 支持多字节字符
  const step = Math.max(16, Math.floor(duration / Math.max(1, len)))

  let i = 0
  const timer = setInterval(() => {
    i += 1
    el.textContent = [...text].slice(0, i).join('')
    if (i >= len) {
      clearInterval(timer)
      el.__typing_timer = null
    }
  }, step)

  el.__typing_timer = timer
}

export default typing

