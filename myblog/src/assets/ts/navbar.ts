import { ref } from 'vue'

// Hysteresis parameters (adjust to taste)
const HIDE_OFFSET = 120 // must scroll down at least this many px from anchor to hide
const SHOW_OFFSET = 40 // must scroll up at least this many px from anchor to show
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

function clearHideTimer() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function getScrollTop(): number {
  // Get the largest value across common scroll containers
  const a = window.pageYOffset || 0
  const b = document.documentElement ? document.documentElement.scrollTop : 0
  const c = document.body ? document.body.scrollTop : 0
  const main = document.querySelector('main') as HTMLElement | null
  const appMain = document.querySelector('.app-main') as HTMLElement | null
  const app = document.querySelector('#app') as HTMLElement | null
  const d = main ? main.scrollTop : 0
  const e = appMain ? appMain.scrollTop : 0
  const f = app ? app.scrollTop : 0
  return Math.max(a, b, c, d, e, f)
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

function applyScrollState() {
  const top = getScrollTop()
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

    // cancel pending hide when user reverses direction
    clearHideTimer()

    if (state === 'hidden') {
      // show only after scrolled up sufficiently from the anchor
      if (anchorTop - top >= SHOW_OFFSET) {
        ensureVisible(top)
      }
    } else {
      // already visible: update anchor to make hiding require a fresh downward travel
      anchorTop = Math.min(anchorTop, top)
    }
  }

  lastScrollTop.value = Math.max(top, 0)
}

const handleScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      applyScrollState()
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
}

export const removeScrollListener = () => {
  listeners.forEach((t) => t.removeEventListener('scroll', handleScroll as EventListener))
  listeners.clear()
  clearHideTimer()
}

export { scrollDirection, scrollDown, scrollUp, isHidden, handleScroll }
