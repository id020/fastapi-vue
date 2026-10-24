import {createRouter, createWebHistory} from 'vue-router'
import {useAuthStore} from '@/stores/auth'
import Dashboard from '@/views/Dashboard.vue'
import Users from '@/views/Users.vue'
import Roles from '@/views/Roles.vue'
import Departments from '@/views/Departments.vue'
import Menus from '@/views/Menus.vue'


/**
 * 一、页面组件映射表
 *
 * 后端菜单数据中通常会返回 component 字段，
 * 例如：
 *
 * {
 *   "name": "用户管理",
 *   "component": "Users"
 * }
 *
 * 这里通过 component 字段找到对应的 Vue 组件。
 *
 * 注意：
 * 只有写在映射表中的组件才能被动态注册。
 */
const pageComponents = {
    // 系统首页
    Dashboard,

    // 用户管理页面
    Users,
    Roles,
    Departments,
    Menus,
}


/**
 * 三、创建 Vue Router 实例
 */
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', redirect: '/dashboard' },
        {
            path: '/',
            name: 'Layout',
            component: () => import('@/layouts/Layout.vue'),
            children: [],
        },
        { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue') },
    ],
})


/**
 * 五、全局前置路由守卫
 */
router.beforeEach(async (to) => {

    // 获取 Pinia 中的认证状态仓库。
    const auth = useAuthStore()

    // 从浏览器中读取当前登录 Token。
    const token = localStorage.getItem('access_token')

    if (to.name === 'Login') {

        // 如果浏览器中存在 Token，尝试恢复登录状态。
        if (token) {
            try {
                // 请求后端 /auth/me，获取当前用户、菜单和权限。
                await auth.loadCurrentUser()

                // 已经处于有效登录状态，无需再次登录。
                return '/dashboard'
            } catch {
                // Token 无效、过期或请求失败时，清除前端保存的登录状态。
                auth.logout()
            }
        }

        // 未登录，或者恢复登录失败，都允许继续访问登录页面。
        return true
    }

    if (!token) {
        return '/login'
    }


    /**
     * 恢复或加载当前用户信息
     *
     * 浏览器刷新后，Pinia 中的数据可能恢复初始值，
     * 所以需要重新向后端获取当前用户信息。
     *
     * loaded 用来表示是否已经成功加载过用户信息。
     */
    try {

        if (!auth.loaded) {
            // 请求后端，更新用户、菜单和权限。
            await auth.loadCurrentUser()
        }


        /*
         * 根据后端菜单动态注册业务路由
         *
         * auth.menus 是后端返回的当前用户菜单。
         *
         * 遍历菜单时，逐一检查：
         * 1. 必须是 menu 类型。
         * 2. 必须存在 path。
         * 3. 同名路由不能重复注册。
         * 4. 必须能在 pageComponents 中找到组件。
         *
         * 只有符合条件的菜单，才会被注册为页面路由。
         */
        for (const menu of auth.menus) {

            // 不是页面菜单，或者没有配置访问路径，就不把它注册为业务页面。
            if ( menu.menu_type !== 'menu' || !menu.path) {
                continue
            }

            /*
             * 这里使用 menu.permission 作为路由名称。
             *
             * 注意：
             * permission 必须存在，并且应当唯一。
             */
            const routeName = menu.permission

            // 没有路由名称，无法可靠地判断是否已注册。
            if (!routeName) {
                continue
            }

            // 如果同名路由已经存在，就不重复添加。
            if (router.hasRoute(routeName)) {
                continue
            }

            /*
             * 根据后端返回的 component 字段，
             * 从白名单中查找对应的 Vue 页面组件。
             *
             * 例如：
             * menu.component === 'Users'
             * 对应 ResourcePage 组件。
             */
            const component = pageComponents[menu.component]

            // 找不到对应组件时，不注册该菜单路由。
            if (!component) {
                continue
            }

            /*
             * 注册动态路由。
             *
             * path：
             * 页面访问路径，例如 /system/users。
             *
             * name：
             * 路由名称，使用菜单权限标识。
             *
             * component：
             * 实际展示的 Vue 组件。
             *
             * props：
             * 如果使用通用资源页面，
             * 则传入对应资源名称。
             *
             * meta：
             * 附加路由信息，方便页面标题和权限检查。
             */
            router.addRoute('Layout', {
                path: menu.path.replace(/^\//, ''),
                name: routeName,
                component,

                // 路由附加信息。
                meta: { permission: menu.permission, title: menu.name },
            })
        }


        /*
         * 处理首次访问动态路由的情况
         *
         * 例如用户直接输入：
         * /system/users
         *
         * 如果页面刚刷新，动态路由尚未注册，
         * Vue Router 可能先匹配到 404 路由。
         *
         * 等上面注册完成后，
         * 需要重新匹配原始地址。
         */
        if ( to.name === 'not-found' && router.resolve(to.path).name !== 'not-found') {
            // 返回原地址，触发重新匹配。
            return to.fullPath
        }


        /*
         * 处理 404 和权限检查
         *
         * 如果目标地址仍然是 404，
         * 说明当前地址没有匹配到已注册路由。
         *
         * 如果路由 meta 中设置了 permission，
         * 就检查当前用户是否具有对应权限。
         */
        if ( to.name === 'not-found' || (to.meta.permission && !auth.hasPermission(to.meta.permission)) ) {
            // 无权访问或页面不存在时，跳转首页。
            return '/dashboard'
        }
        return true

    } catch {
        auth.logout()
        return '/login'
    }
})


// 导出路由实例，供 main.js 注册到 Vue 应用中。
export default router
