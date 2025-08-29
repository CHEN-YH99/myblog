import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import router from './router/index.ts'
import 'element-plus/dist/index.css'
import '@/assets/style/common/scrollbar.scss'  // 滚动条样式
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

app.use(router)
app.use(ElementPlus)
app.mount('#app')
