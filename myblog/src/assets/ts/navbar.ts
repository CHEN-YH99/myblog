import { ref } from 'vue'

// Hysteresis parameters (adjust to taste)
const HIDE_OFFSET = 120 // must scroll down at least this many px from anchor to hide
const SHOW_OFFSET = 0 // show immediately on upward scroll (filtered by DIR_EPS)
const DIR_EPS = 2 // ignore tiny deltas
const BG_DELAY = 500 // background deepen delay before hide

// Reactive flags consumed by NavBar.vue
const scrollDirection = ref('') // 'up' | 'down'
const scrollDown = ref(false)
const scrollUp = ref(true)
const isHidden = ref(false)

// Internal state
const lastScrollTop = ref(0)
let state: 'visible' | 'hidden' = 'visible'
let anchorTop = 0 // baseline when last state changed
let hideTimer: number | null = null
let ticking = false
const listeners = new Set<EventTarget>()

// Wheel/Touch fallback to ensure immediate show on upward intent
let lastTouchY = 0
function onWheel(e: WheelEvent) {
  const dy = e.deltaY
  const top = topFromTarget(e.target as EventTarget)
  if (dy < -DIR_EPS) {
    clearHideTimer()
    ensureVisible(top)
  } else if (dy > DIR_EPS) {
    // only schedule hide; actual hide occurs after delay and offset logic in scroll handler
    scheduleHide(top)
  }
}
function onTouchStart(e: TouchEvent) {
  if (e.touches && e.touches.length) lastTouchY = e.touches[0].clientY
}
function onTouchMove(e: TouchEvent) {
  if (!(e.touches && e.touches.length)) return
  const y = e.touches[0].clientY
  const dy = y - lastTouchY
  lastTouchY = y
  const top = topFromTarget(e.target as EventTarget)
  if (dy > DIR_EPS) {
    clearHideTimer()
    ensureVisible(top)
  } else if (dy < -DIR_EPS) {
    scheduleHide(top)
  }
}
let mo: MutationObserver | null = null

const SCROLL_TARGET_SELECTORS = [
  '.el-scrollbar__wrap',
  '.el-main',
  '.app-main',
  'main'
]

function scanAndAttachScrollableTargets() {
  try {
    SCROLL_TARGET_SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => addListener(el))
    })
  } catch {}
}

function clearHideTimer() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function getScrollTop(): number {
  // Use window scroll position primarily to avoid mixing different containers
  // Mixing multiple containers with Math.max can cause the value to only drop to 0 at the very top,
  // which prevents detecting upward scrolling and delays the show animation.
  return (
    window.pageYOffset ||
    (document.documentElement ? document.documentElement.scrollTop : 0) ||
    (document.body ? document.body.scrollTop : 0) ||
    0
  )
}

function ensureVisible(top: number) {
  clearHideTimer()
  isHidden.value = false
  state = 'visible'
  anchorTop = top
  scrollDown.value = false
  scrollUp.value = true
  scrollDirection.value = 'up'
}

function scheduleHide(top: number) {
  // already scheduled
  if (hideTimer !== null) return
  // ensure in visible state first (background deepen happens immediately via scrollDown=true)
  isHidden.value = false
  hideTimer = window.setTimeout(() => {
    isHidden.value = true
    state = 'hidden'
    anchorTop = top
    hideTimer = null
  }, BG_DELAY)
}

function topFromTarget(target: EventTarget | null | undefined): number {
  try {
    if (!target) return getScrollTop()
    // Window
    if ((target as any).window === (target as any)) {
      return (
        window.pageYOffset ||
        (document.documentElement ? document.documentElement.scrollTop : 0) ||
        (document.body ? document.body.scrollTop : 0) ||
        0
      )
    }
    // Document
    if ((target as any).nodeType === 9) {
      const doc = target as Document
      return (
        doc.scrollingElement?.scrollTop ||
        (doc.documentElement ? doc.documentElement.scrollTop : 0) ||
        (doc.body ? (doc.body as any).scrollTop : 0) ||
        0
      )
    }
    // Elements with scrollTop
    if (typeof (target as any).scrollTop === 'number') {
      return (target as any).scrollTop as number
    }
  } catch {}
  return getScrollTop()
}

function applyScrollState(passedTop?: number) {
  const top = typeof passedTop === 'number' ? passedTop : getScrollTop()
  const delta = top - lastScrollTop.value

  // At very top: reset to visible+light background
  if (top <= 0) {
    ensureVisible(0)
    lastScrollTop.value = 0
    return
  }

  if (delta > DIR_EPS) {
    // scrolling down
    scrollDirection.value = 'down'
    scrollDown.value = true
    scrollUp.value = false

    if (state === 'visible') {
      // hide only after scrolled sufficiently from the anchor
      if (top - anchorTop >= HIDE_OFFSET) {
        scheduleHide(top)
      }
    }
  } else if (delta < -DIR_EPS) {
    // scrolling up
    scrollDirection.value = 'up'
    scrollDown.value = false
    scrollUp.value = true

    // cancel pending hide when user reverses direction and show immediately
    clearHideTimer()
    ensureVisible(top)
  }

  lastScrollTop.value = Math.max(top, 0)
}

const handleScroll = (e?: Event) => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const top = e ? topFromTarget(e.target as EventTarget) : getScrollTop()
      applyScrollState(top)
      ticking = false
    })
    ticking = true
  }
}

function addListener(target: EventTarget | null | undefined) {
  if (!target || listeners.has(target)) return
  target.addEventListener('scroll', handleScroll as EventListener, { passive: true })
  listeners.add(target)
}

export const initScrollListener = () => {
  // initialize baseline
  const top = getScrollTop()
  lastScrollTop.value = top
  state = 'visible'
  anchorTop = top
  isHidden.value = false
  scrollDown.value = false
  scrollUp.value = true
  scrollDirection.value = 'up'

  // listen on common containers (rAF prevents duplicate work)
  addListener(window)
  addListener(document)
  addListener(document.scrollingElement as EventTarget)
  addListener(document.documentElement)
  addListener(document.body)
  addListener(document.querySelector('#app'))
  addListener(document.querySelector('main'))
  addListener(document.querySelector('.app-main'))

  // attach to typical scrollable wrappers (Element Plus etc.)
  scanAndAttachScrollableTargets()

  // NOTE: We intentionally DO NOT listen to wheel/touch intent here.
  // The navbar show/hide should be driven strictly by actual scroll events,
  // so that when the scrollbar is already at the bottom/top and cannot move,
  // wheel gestures do not trigger animations erroneously.

  // observe DOM changes to attach listeners for dynamically created scroll containers
  try {
    if (mo) mo.disconnect()
    mo = new MutationObserver(() => {
      scanAndAttachScrollableTargets()
    })
    mo.observe(document.body, { childList: true, subtree: true })
  } catch {}
}

export const removeScrollListener = () => {
  listeners.forEach((t) => t.removeEventListener('scroll', handleScroll as EventListener))
  listeners.clear()
  clearHideTimer()
}

export { scrollDirection, scrollDown, scrollUp, isHidden, handleScroll }
