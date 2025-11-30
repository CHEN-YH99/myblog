export function setDocumentTitle(title?: string) {
  if (title) document.title = `${title} - 小灰个人博客`
  else document.title = '小灰个人博客'
}

function ensureMeta(name: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  return el
}

export function setMetaDescription(desc?: string) {
  const el = ensureMeta('description', 'name')
  el.setAttribute('content', desc || '小灰个人博客，分享前端/后端/学习资源、说说与相册。')
}

export function setCanonical(url?: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url || window.location.href)
}

export function setOpenGraph({ title, description, url, image }:{ title?: string; description?: string; url?: string; image?: string }) {
  const set = (name: string, content?: string) => {
    const el = ensureMeta(name, 'property')
    el.setAttribute('content', content || '')
  }
  if (title) set('og:title', title)
  if (description) set('og:description', description)
  set('og:type', 'website')
  set('og:url', url || window.location.href)
  if (image) set('og:image', image)
}

export function setRobotsMeta(content: string = 'index,follow') {
  const el = ensureMeta('robots', 'name')
  el.setAttribute('content', content)
}

export function applySEO({ title, description, canonical, image, robots }:{ title?: string; description?: string; canonical?: string; image?: string; robots?: string }) {
  setDocumentTitle(title)
  setMetaDescription(description)
  setCanonical(canonical)
  setOpenGraph({ title, description, url: canonical, image })
  setRobotsMeta(robots || 'index,follow')
}

