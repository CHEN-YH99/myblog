// 路径到导航菜单索引的统一映射工具
// 使用处：NavBar、useArticles、CategoryDetail、CategoryTag 等
export type MenuIndex =
  | 'home'
  | 'timeline'
  | 'frontend'
  | 'backend'
  | 'category'
  | 'photos'
  | 'talk'
  | 'links'
  | 'board'
  | 'login'
  | null

export function mapPathToMenu(path: string | undefined | null): MenuIndex {
  const p = path || '/'
  if (p.startsWith('/user')) return null
  if (p === '/') return 'home'
  if (p === '/timeline') return 'timeline'
  if (p.startsWith('/frontend')) return 'frontend'
  if (p.startsWith('/backend')) return 'backend'
  if (p.startsWith('/category')) return 'category'
  if (p.startsWith('/photoAlbum')) return 'photos'
  if (p.startsWith('/photo-category/')) return 'photos'
  if (p.startsWith('/talk')) return 'talk'
  if (p.startsWith('/links')) return 'links'
  if (p.startsWith('/board')) return 'board'
  if (p.startsWith('/login')) return 'login'
  return 'home'
}

