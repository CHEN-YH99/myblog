<template>
  <div class="login">
    <LoginLeftView></LoginLeftView>

    <div class="right-wrap">
      <div class="top-right-wrap">
        <div class="btn theme-btn" @click="themeAnimation">
          <i class="iconfont-sys">
            {{ isDark ? '&#xe6b5;' : '&#xe725;' }}
          </i>
        </div>
        <ElDropdown @command="changeLanguage" popper-class="langDropDownStyle">
          <div class="btn language-btn">
            <i class="iconfont-sys icon-language">&#xe611;</i>
          </div>
          <template #dropdown>
            <ElDropdownMenu>
              <div v-for="lang in languageOptions" :key="lang.value" class="lang-btn-item">
                <ElDropdownItem
                  :command="lang.value"
                  :class="{ 'is-selected': locale === lang.value }"
                >
                  <span class="menu-txt">{{ lang.label }}</span>
                  <i v-if="locale === lang.value" class="iconfont-sys icon-check">&#xe621;</i>
                </ElDropdownItem>
              </div>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>
      <div class="header">
        <ArtLogo class="icon" />
        <h1>{{ systemName }}</h1>
      </div>
      <div class="login-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            @keyup.enter="handleSubmit"
            style="margin-top: 25px"
          >
            <ElFormItem prop="account">
              <ElSelect v-model="formData.account" @change="setupAccount" class="account-select">
                <ElOption
                  v-for="account in accounts"
                  :key="account.key"
                  :label="account.label"
                  :value="account.key"
                >
                  <span>{{ account.label }}</span>
                </ElOption>
              </ElSelect>
            </ElFormItem>
            <ElFormItem prop="username">
              <ElInput :placeholder="$t('login.placeholder[0]')" v-model.trim="formData.username" />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                :placeholder="$t('login.placeholder[1]')"
                v-model.trim="formData.password"
                type="password"
                radius="8px"
                autocomplete="off"
                show-password
              />
            </ElFormItem>
            <div class="drag-verify">
              <div class="drag-verify-content" :class="{ error: !isPassing && isClickPass }">
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  :text="$t('login.sliderText')"
                  textColor="var(--art-gray-800)"
                  :successText="$t('login.sliderSuccessText')"
                  :progressBarBg="getCssVar('--el-color-primary')"
                  background="var(--art-gray-200)"
                  handlerBg="var(--art-main-bg-color)"
                />
              </div>
              <p class="error-text" :class="{ 'show-error-text': !isPassing && isClickPass }">{{
                $t('login.placeholder[2]')
              }}</p>
            </div>

            <div class="forget-password">
              <ElCheckbox v-model="formData.rememberPassword">{{
                $t('login.rememberPwd')
              }}</ElCheckbox>
              <RouterLink :to="RoutesAlias.ForgetPassword">{{ $t('login.forgetPwd') }}</RouterLink>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="login-btn"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>

            <div class="footer">
              <p>
                {{ $t('login.noAccount') }}
                <RouterLink :to="RoutesAlias.Register">{{ $t('login.register') }}</RouterLink>
              </p>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useRouter } from 'vue-router'
  import AppConfig from '@/config'
  import { RoutesAlias } from '@/router/routesAlias'
  import { ElNotification, ElMessage } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { getCssVar } from '@/utils/ui'
  import { languageOptions } from '@/locales'
  import { LanguageEnum } from '@/enums/appEnum'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { themeAnimation } from '@/utils/theme/animation'
  import { fetchLogin, fetchGetUserInfo } from '@/api/auth'
  import { fetchGetRoleList } from '@/api/system-manage'

  defineOptions({ name: 'Login' })

  const { t } = useI18n()
  import { useSettingStore } from '@/store/modules/setting'
  import type { FormInstance, FormRules } from 'element-plus'

  type AccountKey = string
  type RoleListItem = Api.SystemManage.RoleListItem

  export interface Account {
    key: AccountKey
    label: string
    userName: string
    password: string
    roleCode: string
  }

  // 基于后端角色动态生成账号选项，自动匹配预置演示账号
  const roleOptions = ref<RoleListItem[]>([])
  const roleLoading = ref(false)

  const ACCOUNT_PRESETS = computed<Record<string, { label: string; userName: string; password: string }>>(() => ({
    SUPER_ADMIN: { label: t('login.roles.super'), userName: 'superadmin', password: '123456' },
    ADMIN: { label: t('login.roles.admin'), userName: 'admin', password: 'Xanxus2979@' },
    EDITOR: { label: t('login.roles.editor'), userName: 'editor', password: '123456' },
    USER: { label: t('login.roles.user'), userName: 'user1', password: 'a123456' }
  }))

  const accounts = computed<Account[]>(() => {
    if (!roleOptions.value?.length) return []
    const list: Account[] = []
    for (const role of roleOptions.value) {
      if (!role?.enabled) continue
      const code = String(role.roleCode || '').toUpperCase()
      const preset = ACCOUNT_PRESETS.value[code]
      if (preset) {
        list.push({
          key: code,
          label: preset.label || role.roleName,
          userName: preset.userName,
          password: preset.password,
          roleCode: code
        })
      }
    }
    return list
  })

  const loadRoleOptions = async () => {
    roleLoading.value = true
    try {
      const res = await fetchGetRoleList({
        current: 1,
        size: 200,
        enabled: true
      })
      roleOptions.value = (res?.records || []).filter((role) => role.enabled)
    } catch (error) {
      console.error('[Login] 获取角色列表失败', error)
      ElMessage.error('获取角色列表失败，请稍后重试')
    } finally {
      roleLoading.value = false
    }
  }

  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)

  const dragVerify = ref()

  const userStore = useUserStore()
  const router = useRouter()
  const isPassing = ref(false)
  const isClickPass = ref(false)

  const systemName = AppConfig.systemInfo.name
  const formRef = ref<FormInstance>()

  const formData = reactive({
    account: '',
    username: '',
    password: '',
    roleCode: '',
    rememberPassword: true
  })

  const ensureRoleSelectionValid = () => {
    if (!roleOptions.value.length) {
      if (formData.roleCode) {
        formData.roleCode = ''
      }
      return
    }
    const exists = roleOptions.value.some((role) => role.roleCode === formData.roleCode)
    if (!exists) {
      formData.roleCode = roleOptions.value[0].roleCode
    }
  }

  watch(roleOptions, () => {
    ensureRoleSelectionValid()
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: t('login.placeholder[0]'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.placeholder[1]'), trigger: 'blur' }],
    roleCode: [{ required: true, message: '请选择登录角色', trigger: 'change' }]
  }))

  const loading = ref(false)

  onMounted(async () => {
    await loadRoleOptions()
    // 基于后端角色数据，默认选择普通用户（USER），否则选第一个
    const defaultItem = accounts.value.find((a) => a.roleCode === 'USER') || accounts.value[0]
    if (defaultItem) setupAccount(defaultItem.key as AccountKey)
  })

  // 监听角色选项变化，首次加载时自动选择
  watch(accounts, (val) => {
    if (!val?.length) return
    if (!formData.account) {
      const def = val.find((a) => a.roleCode === 'USER') || val[0]
      setupAccount(def.key as AccountKey)
    }
  })

  // 设置账号：根据所选角色填充匹配该角色的账号与密码，并确保角色编码与后端一致
  const setupAccount = (key: AccountKey) => {
    const selectedAccount = accounts.value.find((account: Account) => String(account.key).toUpperCase() === String(key).toUpperCase())
    formData.account = selectedAccount?.key || ''
    formData.username = selectedAccount?.userName || ''
    formData.password = selectedAccount?.password || ''
    formData.roleCode = selectedAccount?.roleCode || ''
  }

  // 登录
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      // 表单验证
      const valid = await formRef.value.validate()
      if (!valid) return

      // 拖拽验证
      if (!isPassing.value) {
        isClickPass.value = true
        return
      }

      loading.value = true

      // 登录请求
      const { username, password, roleCode } = formData
      if (!roleCode) {
        ElMessage.warning('请选择登录角色')
        loading.value = false
        resetDragVerify()
        return
      }

      const loginPayload = { username, password, roleCode }

      let token: string | undefined
      let refreshToken: string | undefined
      const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL as string | undefined

      // 优先使用封装的请求
      try {
        const res = await fetchLogin(loginPayload)
        token = res.token
        refreshToken = res.refreshToken
      } catch (err) {
        // 网络错误容错：回退使用原生fetch避免拦截器影响
        const isHttpError = err instanceof HttpError
        const isNetworkError = isHttpError && err.code === 400 && /网络连接/.test(err.message)
        if (isNetworkError) {
          // 先尝试通过Vite代理的相对路径
          const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginPayload)
          })
          if (!resp.ok) {
            // 如果代理仍不可用，直接请求后端地址（已启用CORS）
            const directUrl = `${API_PROXY_URL || 'http://localhost:3001'}/api/auth/login`
            const directResp = await fetch(directUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(loginPayload)
            })
            if (!directResp.ok) throw new Error('登录失败')
            const directJson = await directResp.json()
            if (directJson && (directJson.code === 200 || directJson.code === 201) && directJson.data) {
              token = directJson.data.token
              refreshToken = directJson.data.refreshToken
            } else {
              throw new Error(directJson?.msg || '登录失败')
            }
          } else {
            const json = await resp.json()
            if (json && (json.code === 200 || json.code === 201) && json.data) {
              token = json.data.token
              refreshToken = json.data.refreshToken
            } else {
              throw new Error(json?.msg || '登录失败')
            }
          }
        } else {
          throw err
        }
      }

      // 验证token
      if (!token) {
        throw new Error('Login failed - no token received')
      }

      // 存储token和用户信息
      userStore.setToken(token, refreshToken)
      // 获取用户信息；若网络层仍异常，直接请求后端地址
      let userInfo
      try {
        userInfo = await fetchGetUserInfo()
      } catch (err) {
        const isHttpError = err instanceof HttpError
        const isNetworkError = isHttpError && err.code === 400 && /网络连接/.test(err.message)
        if (isNetworkError) {
          const resp = await fetch('/api/auth/user-info', { 
            method: 'GET',
            headers: { Authorization: token as string }
          })
          if (!resp.ok) {
            const directUrl = `${API_PROXY_URL || 'http://localhost:3001'}/api/auth/user-info`
            const directResp = await fetch(directUrl, { 
              method: 'GET',
              headers: { Authorization: token as string }
            })
            if (!directResp.ok) throw new Error('获取用户信息失败')
            const directJson = await directResp.json()
            if (directJson && (directJson.code === 200 || directJson.code === 201) && directJson.data) {
              userInfo = directJson.data
            } else {
              throw new Error(directJson?.msg || '获取用户信息失败')
            }
          } else {
            const json = await resp.json()
            if (json && (json.code === 200 || json.code === 201) && json.data) {
              userInfo = json.data
            } else {
              throw new Error(json?.msg || '获取用户信息失败')
            }
          }
        } else {
          throw err
        }
      }
      userStore.setUserInfo(userInfo)
      userStore.setLoginStatus(true)

      // 登录成功处理
      showLoginSuccessNotice()
      router.push('/')
    } catch (error) {
      // 处理 HttpError
      if (error instanceof HttpError) {
        ElMessage.error(error.message || '登录失败，请稍后重试')
      } else {
        // 处理非 HttpError
        ElMessage.error('登录失败，请稍后重试')
        console.error('[Login] Unexpected error:', error)
      }
    } finally {
      loading.value = false
      resetDragVerify()
    }
  }

  // 重置拖拽验证
  const resetDragVerify = () => {
    dragVerify.value.reset()
  }

  // 登录成功提示
  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      })
    }, 150)
  }

  // 切换语言
  const { locale } = useI18n()

  const changeLanguage = (lang: LanguageEnum) => {
    if (locale.value === lang) return
    locale.value = lang
    userStore.setLanguage(lang)
  }
</script>

<style lang="scss" scoped>
  @use './index';
</style>
