import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { ref, nextTick } from 'vue'
import NProgress from 'nprogress'
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user'
import { useMenuStore } from '@/store/modules/menu'
import { setWorktab } from '@/utils/navigation'
import { setPageTitle, setSystemTheme } from '../utils/utils'
import { fetchGetMenuList } from '@/api/system-manage'
import { registerDynamicRoutes } from '../utils/registerRoutes'
import { AppRouteRecord } from '@/types/router'
import { RoutesAlias } from '../routesAlias'
import { menuDataToRouter } from '../utils/menuToRouter'
import { asyncRoutes } from '../../views/dashboard/asyncRoutes'
import { loadingService } from '@/utils/ui'
import { useCommon } from '@/composables/useCommon'
import { useWorktabStore } from '@/store/modules/worktab'
import { fetchGetUserInfo } from '@/api/auth'

// 前端权限模式 loading 关闭延时，提升用户体验
const LOADING_DELAY = 100

// 是否已注册动态路由
const isRouteRegistered = ref(false)

// 跟踪是否需要关闭 loading
const pendingLoading = ref(false)

/**
 * 设置路由全局前置守卫
 */
export function setupBeforeEachGuard(router: Router): void {
  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      try {
        await handleRouteGuard(to, from, next, router)
      } catch (error) {
        console.error('路由守卫处理失败:', error)
        next('/exception/500')
      }
    }
  )

  // 设置后置守卫以关闭 loading 和进度条
  setupAfterEachGuard(router)
}

/**
 * 设置路由全局后置守卫
 */
function setupAfterEachGuard(router: Router): void {
  router.afterEach(() => {
    // 关闭进度条
    const settingStore = useSettingStore()
    if (settingStore.showNprogress) {
      NProgress.done()
    }

    // 关闭 loading 效果
    if (pendingLoading.value) {
      nextTick(() => {
        loadingService.hideLoading()
        pendingLoading.value = false
      })
    }
  })
}

/**
 * 处理路由守卫逻辑
 */
async function handleRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  const settingStore = useSettingStore()
  const userStore = useUserStore()

  // 处理进度条
  if (settingStore.showNprogress) {
    NProgress.start()
  }

  // 设置系统主题
  setSystemTheme(to)

  // 处理登录状态
  if (!(await handleLoginStatus(to, userStore, next))) {
    return
  }

  // 处理动态路由注册
  if (!isRouteRegistered.value && userStore.isLogin) {
    await handleDynamicRoutes(to, from, next, router)
    return
  }

  // 基于 meta.roles 的访问控制（适用于所有路由，包括静态路由）
  const requiredRoles = (to.meta?.roles as string[] | undefined) || []
  if (requiredRoles.length > 0) {
    // 路由需要角色权限，未登录则跳转登录
    if (!userStore.isLogin) {
      userStore.logOut()
      next(RoutesAlias.Login)
      return
    }

    const userRolesSet = getUserRoleTokens()
    
    // 超级管理员可以访问所有需要权限的路由
    const isSuperAdmin = userRolesSet.has('R_SUPER') || userRolesSet.has('SUPER')
    
    // 检查权限：超级管理员或只读用户或拥有所需角色
    const hasPermission = isSuperAdmin || userStore.isReadOnly || requiredRoles.some((role: string) => userRolesSet.has(role))
    if (!hasPermission) {
      next('/exception/403')
      return
    }
  }

  // 处理根路径跳转到首页
  if (userStore.isLogin && isRouteRegistered.value && handleRootPathRedirect(to, next)) {
    return
  }

  // 处理已知的匹配路由
  if (to.matched.length > 0) {
    setWorktab(to)
    setPageTitle(to)
    next()
    return
  }

  // 尝试刷新路由重新注册
  if (userStore.isLogin && !isRouteRegistered.value) {
    await handleDynamicRoutes(to, from, next, router)
    return
  }

  // 未匹配到路由，跳转到 404
  next('/exception/404')
}

/**
 * 处理登录状态
 */
async function handleLoginStatus(
  to: RouteLocationNormalized,
  userStore: ReturnType<typeof useUserStore>,
  next: NavigationGuardNext
): Promise<boolean> {
  if (!userStore.isLogin && to.path !== RoutesAlias.Login && !to.meta.noLogin) {
    userStore.logOut()
    next(RoutesAlias.Login)
    return false
  }
  return true
}

/**
 * 处理动态路由注册
 */
async function handleDynamicRoutes(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  try {
    // 显示 loading 并标记 pending
    pendingLoading.value = true
    loadingService.showLoading()

    // 获取用户信息
    const userStore = useUserStore()
    const isRefresh = from.path === '/'
    if (isRefresh || !userStore.info || Object.keys(userStore.info).length === 0) {
      try {
        const data = await fetchGetUserInfo()
        userStore.setUserInfo(data)
      } catch (error) {
        console.error('获取用户信息失败', error)
      }
    }

    await getMenuData(router)

    // 处理根路径跳转
    if (handleRootPathRedirect(to, next)) {
      return
    }

    next({
      path: to.path,
      query: to.query,
      hash: to.hash,
      replace: true
    })
  } catch (error) {
    console.error('动态路由注册失败:', error)
    next('/exception/500')
  }
}

/**
 * 获取菜单数据
 */
async function getMenuData(router: Router): Promise<void> {
  try {
    if (useCommon().isFrontendMode.value) {
      await processFrontendMenu(router)
    } else {
      await processBackendMenu(router)
    }
  } catch (error) {
    handleMenuError(error)
    throw error
  }
}

/**
 * 处理前端控制模式的菜单逻辑
 */
async function processFrontendMenu(router: Router): Promise<void> {
  const menuList = asyncRoutes.map((route) => menuDataToRouter(route))
  const userStore = useUserStore()
  const userRolesSet = getUserRoleTokens()

  if (!userRolesSet || userRolesSet.size === 0) {
    throw new Error('获取用户角色失败')
  }

  // 检查是否为超级管理员
  const isSuperAdmin = userRolesSet.has('R_SUPER') || userRolesSet.has('SUPER')

  // 只读用户（普通用户）放开菜单可见性，允许访问所有菜单；超级管理员也可以访问所有菜单；其余按角色过滤
  const filteredMenuList = (userStore.isReadOnly || isSuperAdmin) ? menuList : filterMenuByRoles(menuList, Array.from(userRolesSet))

  // 添加延时以提升用户体验
  await new Promise((resolve) => setTimeout(resolve, LOADING_DELAY))

  await registerAndStoreMenu(router, filteredMenuList)
}

/**
 * 处理后端控制模式的菜单逻辑
 */
async function processBackendMenu(router: Router): Promise<void> {
  const { menuList } = await fetchGetMenuList()
  await registerAndStoreMenu(router, menuList)
}

/**
 * 递归过滤空菜单项
 */
function filterEmptyMenus(menuList: AppRouteRecord[]): AppRouteRecord[] {
  return menuList
    .map((item) => {
      // 如果有子菜单，先递归过滤子菜单
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterEmptyMenus(item.children)
        return {
          ...item,
          children: filteredChildren
        }
      }
      return item
    })
    .filter((item) => {
      // 过滤掉布局组件且没有子菜单的项
      const isEmptyLayoutMenu =
        item.component === RoutesAlias.Layout && (!item.children || item.children.length === 0)

      // 过滤掉组件为空字符串且没有子菜单的项，但保留有外链的菜单项
      const isEmptyComponentMenu =
        item.component === '' &&
        (!item.children || item.children.length === 0) &&
        item.meta.isIframe !== true &&
        !item.meta.link

      return !(isEmptyLayoutMenu || isEmptyComponentMenu)
    })
}

/**
 * 注册路由并存储菜单数据
 */
async function registerAndStoreMenu(router: Router, menuList: AppRouteRecord[]): Promise<void> {
  if (!isValidMenuList(menuList)) {
    throw new Error('获取菜单列表失败，请重新登录')
  }
  const menuStore = useMenuStore()
  // 递归过滤掉为空的菜单项
  const list = filterEmptyMenus(menuList)
  menuStore.setMenuList(list)
  registerDynamicRoutes(router, list)
  isRouteRegistered.value = true
  useWorktabStore().validateWorktabs(router)
}

/**
 * 处理菜单相关错误
 */
function handleMenuError(error: unknown): void {
  console.error('菜单处理失败:', error)
  useUserStore().logOut()
  throw error instanceof Error ? error : new Error('获取菜单列表失败，请重新登录')
}

/**
 * 根据角色过滤菜单
 */
const filterMenuByRoles = (menu: AppRouteRecord[], roles: string[]): AppRouteRecord[] => {
  // 规范化角色列表，将角色名称转换为角色代码
  const normalizedRoles = normalizeRoles(roles)
  
  // 检查是否为超级管理员
  const isSuperAdmin = normalizedRoles.has('R_SUPER') || normalizedRoles.has('SUPER')
  
  return menu.reduce((acc: AppRouteRecord[], item) => {
    const itemRoles = item.meta?.roles
    
    // 超级管理员可以访问所有菜单
    let hasPermission = isSuperAdmin
    
    // 如果不是超级管理员，则检查角色权限
    if (!hasPermission) {
      hasPermission = !itemRoles || itemRoles.some((role: string) => normalizedRoles.has(role))
    }

    if (hasPermission) {
      const filteredItem = { ...item }
      if (filteredItem.children?.length) {
        filteredItem.children = filterMenuByRoles(filteredItem.children, roles)
      }
      acc.push(filteredItem)
    }

    return acc
  }, [])
}

/**
 * 规范化角色列表
 * 将角色名称转换为角色代码，支持多种格式
 */
type RoleInput = string | { roleCode?: string; code?: string; roleName?: string; name?: string }
const normalizeRoles = (roles: RoleInput[]): Set<string> => {
  const normalized = new Set<string>()

  const pushByName = (name: string) => {
    const n = name.trim()
    const up = n.toUpperCase()
    normalized.add(up)
    // 映射常见别名与中文
    if (up === '超级管理员' || up === 'SUPER_ADMIN' || up === 'SUPERADMIN' || up === 'SUPER') {
      normalized.add('R_SUPER')
      normalized.add('SUPER')
      normalized.add('SUPER_ADMIN')
    } else if (up === '管理员' || up === 'ADMIN') {
      normalized.add('R_ADMIN')
      normalized.add('ADMIN')
    } else if (up === '普通用户' || up === 'USER') {
      normalized.add('R_USER')
      normalized.add('USER')
    }
  }

  roles?.forEach((role) => {
    if (!role) return
    if (typeof role === 'string') {
      pushByName(role)
    } else if (typeof role === 'object') {
      const code = (role as any).roleCode || (role as any).code
      const name = (role as any).roleName || (role as any).name
      if (code) pushByName(String(code))
      if (name) pushByName(String(name))
    } else {
      pushByName(String(role))
    }
  })

  return normalized
}

/**
 * 从用户信息构建角色令牌集合
 * 统一收敛不同来源（roles 字符串数组、userRoles 对象数组、roleCode/roleName 单字段）
 */
interface MaybeUserInfo {
  roles?: string[]
  userRoles?: Array<string | { roleCode?: string; roleName?: string }>
  roleCode?: string
  roleName?: string
}
function getUserRoleTokens(): Set<string> {
  const userStore = useUserStore()
  const info = (userStore.info || {}) as MaybeUserInfo

  const raw: RoleInput[] = []
  // 1) roles: string[]
  if (Array.isArray(info.roles)) raw.push(...info.roles)
  // 2) userRoles: [{ roleCode, roleName } | string]
  if (Array.isArray(info.userRoles)) raw.push(...(info.userRoles as RoleInput[]))
  // 3) 单字段
  if (info.roleCode) raw.push(String(info.roleCode))
  if (info.roleName) raw.push(String(info.roleName))

  return normalizeRoles(raw)
}

/**
 * 验证菜单列表是否有效
 */
function isValidMenuList(menuList: AppRouteRecord[]): boolean {
  return Array.isArray(menuList) && menuList.length > 0
}

/**
 * 重置路由相关状态
 */
export function resetRouterState(): void {
  isRouteRegistered.value = false
  const menuStore = useMenuStore()
  menuStore.removeAllDynamicRoutes()
  menuStore.setMenuList([])
}

/**
 * 处理根路径跳转到首页
 */
function handleRootPathRedirect(to: RouteLocationNormalized, next: NavigationGuardNext): boolean {
  if (to.path === '/') {
    const { homePath } = useCommon()
    // 防止无限重定向：确保 homePath 不为空且不等于 '/'
    if (homePath.value && homePath.value !== '/' && homePath.value.trim() !== '') {
      next({ path: homePath.value, replace: true })
      return true
    }
  }
  return false
}
