import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import App from '@/App.vue'
import ElementPlus from 'element-plus'
import router from '@/router/index'
import { useUserStore } from '@/stores/user'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/style/common/scrollbar.scss' // 滚动条样式
import '@/assets/style/common/theme.scss' // 主题样式
import '@/assets/style/common/headpicture.scss' // 头部大图样式
import 'animate.css' // 动画库
import '@/assets/style/index.scss' // 全局样式与重置，全站生效

const app = createApp(App)
const pinia = createPinia()

// 配置pinia持久化插件
pinia.use(
  createPersistedState({
    storage: localStorage,
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
  }),
)

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 异步初始化用户状态
;(async () => {
  const userStore = useUserStore()
  await userStore.initUserState()
  app.mount('#app')
})()
