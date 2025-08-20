import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import router from './router/index.ts'
import 'element-plus/dist/index.css'
import { ElImage } from 'element-plus'
const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.use(ElImage)
app.mount('#app')
