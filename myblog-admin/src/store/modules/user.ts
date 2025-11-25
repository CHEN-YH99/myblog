import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LanguageEnum } from '@/enums/appEnum'
import { router } from '@/router'
import { useSettingStore } from '@/store/modules/setting'
import { useWorktabStore } from '@/store/modules/worktab'
import { AppRouteRecord } from '@/types/router'
import { setPageTitle } from '@/router/utils/utils'
import { resetRouterState } from '@/router/guards/beforeEach'
import { RoutesAlias } from '@/router/routesAlias'
import { useMenuStore } from '@/store/modules/menu'

/**
 * 用户状态管理
 * 管理用户登录状态、个人信息、语言设置、搜索历史、锁屏状态等
 */
export const useUserStore = defineStore(
  'userStore',
  () => {
    // 语言设置
    const language = ref(LanguageEnum.ZH)
    // 登录状态
    const isLogin = ref(false)
    // 锁屏状态
    const isLock = ref(false)
    // 锁屏密码
    const lockPassword = ref('')
    // 用户信息
    const info = ref<Partial<Api.Auth.UserInfo>>({})
    // 搜索历史记录
    const searchHistory = ref<AppRouteRecord[]>([])
    // 访问令牌
    const accessToken = ref('')
    // 刷新令牌
    const refreshToken = ref('')

    // 计算属性：获取用户信息
    const getUserInfo = computed(() => info.value)
    // 计算属性：获取设置状态
    const getSettingState = computed(() => useSettingStore().$state)
    // 计算属性：获取工作台状态
    const getWorktabState = computed(() => useWorktabStore().$state)

    /**
     * 计算属性：是否只读用户
     * 当用户拥有管理员或超级管理员角色时，isReadOnly 为 false（可编辑）
     * 当用户仅拥有普通用户角色时，isReadOnly 为 true（只读）
     */
    const isReadOnly = computed(() => {
      // 归一化角色码，兼容多种返回
      const normalize = (val: unknown): string[] => {
        const codes = new Set<string>()

        // 1) roles: string[] 情况
        const rolesArr = Array.isArray((val as any)?.roles) ? (val as any).roles : []
        rolesArr.forEach((r: any) => {
          if (typeof r === 'string') codes.add(String(r).trim().toUpperCase())
          if (r && typeof r === 'object' && 'roleCode' in r) codes.add(String((r as any).roleCode).trim().toUpperCase())
        })

        // 2) userRoles: 对象数组或字符串数组
        const userRoles = (val as any)?.userRoles
        if (Array.isArray(userRoles)) {
          userRoles.forEach((r: any) => {
            if (typeof r === 'string') {
              codes.add(r.trim().toUpperCase())
            } else if (r && typeof r === 'object') {
              if (r.roleCode) codes.add(String(r.roleCode).trim().toUpperCase())
              if (r.roleName) {
                const name = String(r.roleName).trim()
                if (name === '超级管理员') codes.add('R_SUPER')
                if (name === '管理员') codes.add('R_ADMIN')
                if (name === '普通用户') codes.add('R_USER')
              }
            }
          })
        }

        // 3) 从 info.value 中直接推断（某些后端仅有单个 roleCode/roleName）
        const maybeCode = (val as any)?.roleCode
        const maybeName = (val as any)?.roleName
        if (maybeCode) codes.add(String(maybeCode).trim().toUpperCase())
        if (maybeName) {
          const name = String(maybeName).trim()
          if (name === '超级管理员') codes.add('R_SUPER')
          if (name === '管理员') codes.add('R_ADMIN')
          if (name === '普通用户') codes.add('R_USER')
        }

        return Array.from(codes)
      }

      const roleCodes = normalize(info.value)

      // 如果拥有管理员或超级管理员角色，则不是只读（可以编辑）
      const adminSet = new Set(['R_ADMIN', 'ADMIN', 'R_SUPER', 'SUPER', 'SUPER_ADMIN'])
      const hasAdmin = roleCodes.some((c) => adminSet.has(c))
      if (hasAdmin) return false

      // 如果仅拥有普通用户角色，则是只读
      const userSet = new Set(['R_USER', 'USER'])
      const hasUser = roleCodes.some((c) => userSet.has(c))
      return hasUser
    })

    /**
     * 设置用户信息
     * @param newInfo 新的用户信息
     */
    const setUserInfo = (newInfo: Api.Auth.UserInfo) => {
      info.value = newInfo
    }

    /**
     * 刷新用户信息（用于权限变更后重新加载）
     */
    const refreshUserInfo = async () => {
      try {
        const { fetchGetUserInfo } = await import('@/api/auth')
        const newInfo = await fetchGetUserInfo()
        setUserInfo(newInfo)
        console.log('[refreshUserInfo] 用户信息已刷新:', newInfo)
        return true
      } catch (error) {
        console.error('[refreshUserInfo] 刷新用户信息失败:', error)
        return false
      }
    }

    /**
     * 更新用户角色和权限
     * @param newRoles 新的角色列表
     * @param newPermissions 新的权限列表
     */
    const updateUserRoles = (newRoles: string[], newPermissions: string[] = []) => {
      if (info.value) {
        info.value.roles = newRoles
        if (newPermissions.length > 0) {
          info.value.permissions = newPermissions
        }
        console.log('[updateUserRoles] 用户角色已更新:', newRoles)
      }
    }

    /**
     * 设置登录状态
     * @param status 登录状态
     */
    const setLoginStatus = (status: boolean) => {
      isLogin.value = status
    }

    /**
     * 设置语言
     * @param lang 语言枚举值
     */
    const setLanguage = (lang: LanguageEnum) => {
      setPageTitle(router.currentRoute.value)
      language.value = lang
    }

    /**
     * 设置搜索历史
     * @param list 搜索历史列表
     */
    const setSearchHistory = (list: AppRouteRecord[]) => {
      searchHistory.value = list
    }

    /**
     * 设置锁屏状态
     * @param status 锁屏状态
     */
    const setLockStatus = (status: boolean) => {
      isLock.value = status
    }

    /**
     * 设置锁屏密码
     * @param password 锁屏密码
     */
    const setLockPassword = (password: string) => {
      lockPassword.value = password
    }

    /**
     * 设置令牌
     * @param newAccessToken 访问令牌
     * @param newRefreshToken 刷新令牌（可选）
     */
    const setToken = (newAccessToken: string, newRefreshToken?: string) => {
      accessToken.value = newAccessToken
      if (newRefreshToken) {
        refreshToken.value = newRefreshToken
      }
    }

    /**
     * 退出登录
     * 清空所有用户相关状态并跳转到登录页
     */
    const logOut = () => {
      // 清空用户信息
      info.value = {}
      // 重置登录状态
      isLogin.value = false
      // 重置锁屏状态
      isLock.value = false
      // 清空锁屏密码
      lockPassword.value = ''
      // 清空访问令牌
      accessToken.value = ''
      // 清空刷新令牌
      refreshToken.value = ''
      // 清空工作台已打开页面
      useWorktabStore().opened = []
      // 移除iframe路由缓存
      sessionStorage.removeItem('iframeRoutes')
      // 清空主页路径
      useMenuStore().setHomePath('')
      // 重置路由状态
      resetRouterState()
      // 跳转到登录页
      router.push(RoutesAlias.Login)
    }

    return {
      language,
      isLogin,
      isLock,
      lockPassword,
      info,
      searchHistory,
      accessToken,
      refreshToken,
      getUserInfo,
      getSettingState,
      getWorktabState,
      isReadOnly,
      setUserInfo,
      refreshUserInfo,
      updateUserRoles,
      setLoginStatus,
      setLanguage,
      setSearchHistory,
      setLockStatus,
      setLockPassword,
      setToken,
      logOut
    }
  },
  {
    persist: {
      key: 'user',
      storage: localStorage
    }
  }
)
