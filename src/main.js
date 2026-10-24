import { createApp } from 'vue'
import { createPinia } from 'pinia'
// 引入全局样式
import './style.css'
import App from './App.vue'
import router from './router'
// 引入element-plus框架
import ElementPlus from 'element-plus'
// 引入element-plus css样式
import 'element-plus/dist/index.css'
// 引入国际化中文
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 引入图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'


const app = createApp(App)

app.use(createPinia())
app.use(router)

// 使用element-plus
app.use(ElementPlus, {
    locale: zhCn, // 使用中文
})

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.mount('#app')
