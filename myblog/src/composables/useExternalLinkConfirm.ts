import { onBeforeUnmount } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

export interface ExternalLinkOptions {
  // 不提示的域名白名单（例如你的跳转常用站）
  whitelistDomains?: string[]
  // 自定义判定是否外链
  isExternal?: (url: string) => boolean
}

const defaultWhitelist = new Set<string>([
  'localhost',
  '127.0.0.1',
  typeof window !== 'undefined' ? window.location.hostname : ''
].filter(Boolean))

function getHostname(href: string): string | null {
  try {
    const u = new URL(href, window.location.href)
    return u.hostname
  } catch {
    return null
  }
}

function defaultIsExternal(url: string): boolean {
  try {
    const u = new URL(url, window.location.href)
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname !== window.location.hostname
  } catch {
    return false
  }
}

export function useExternalLinkConfirm(opts: ExternalLinkOptions = {}) {
  const whitelist = new Set<string>([...defaultWhitelist, ...(opts.whitelistDomains || [])])
  const isExternal = (href: string) => (opts.isExternal || defaultIsExternal)(href)

  const confirmAndOpen = async (href: string) => {
    const host = getHostname(href) || href
    try {
      await ElMessageBox.confirm(
        `您将离开本站，前往：<b>${host}</b><br/><span style="font-size:12px;color:#909399">请注意甄别链接安全</span>`,
        '外部链接提醒',
        {
          type: 'warning',
          confirmButtonText: '继续访问',
          cancelButtonText: '取消',
          dangerouslyUseHTMLString: true,
          center: true,
        }
      )
      window.open(href, '_blank', 'noopener,noreferrer')
      ElMessage.success('已在新标签页打开')
    } catch {
      // 用户取消
    }
  }

  const handler = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return

    // 找到最近的 a 标签
    const anchor = target.closest('a') as HTMLAnchorElement | null
    if (!anchor) return

    const href = anchor.getAttribute('href') || ''
    if (!href) return

    // 忽略内部锚点与 hash 路由
    if (href.startsWith('#')) return

    const host = getHostname(href)
    if (!host) return

    if (!isExternal(href)) return

    // 白名单域名不拦截
    if (whitelist.has(host)) return

    // 拦截默认行为，弹窗确认
    e.preventDefault()
    e.stopPropagation()
    confirmAndOpen(anchor.href)
  }

  const enable = () => {
    document.addEventListener('click', handler, true)
  }

  const disable = () => {
    document.removeEventListener('click', handler, true)
  }

  onBeforeUnmount(() => disable())

  return { enable, disable, confirmAndOpen, isExternal }
}

