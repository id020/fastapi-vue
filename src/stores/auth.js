import {defineStore} from 'pinia'
import {request} from "@/utils/request.js";


// ============================================================
// 一、定义用户认证状态仓库
// ============================================================

/**
 * 用户认证 Store
 *
 * 使用 Pinia 管理全局用户认证状态，包括：
 * 1. 当前登录用户的信息。
 * 2. 当前用户可以访问的菜单。
 * 3. 当前用户拥有的操作权限。
 * 4. 当前用户信息和权限是否已经加载完成。
 *
 * defineStore() 参数说明：
 * 第一个参数 'auth'：Store 的唯一标识，用于区分不同的 Store。
 * 第二个参数：配置 Store 的状态、计算属性和操作方法。
 *
 * 在 Vue 组件中可以通过 useAuthStore() 获取这个 Store。
 */
export const useAuthStore = defineStore('auth', {
    // ========================================================
    // 二、定义全局状态 state
    // ========================================================

    /**
     * state 用于保存需要在多个组件之间共享的数据。
     *
     * 组件可以读取这些状态，也可以通过 Store 的 actions
     * 修改这些状态。
     */
    state: () => ({
        // 当前登录用户的信息。
        user: null,

        // 当前用户可以访问的菜单列表。
        menus: [],

        // 当前用户拥有的权限标识集合。
        // 例如：['user:list', 'user:create', 'user:delete']。
        // 可以用于控制按钮是否显示，以及操作是否可用。
        permissions: [],

        // 标记当前用户信息、菜单和权限是否已经加载完成。
        // false：尚未加载，或需要重新加载。
        // true：已经成功完成加载。
        // 注意：该字段只表示加载状态，不等同于用户一定拥有有效权限。
        loaded: false
    }),

    // ========================================================
    // 三、定义计算属性 getters
    // ========================================================

    /**
     * getters 用于根据当前状态计算或派生数据。
     *
     * 这里定义 hasPermission，用于检查当前用户是否拥有指定权限。
     *
     * Pinia Getter 的写法：
     * (state) => (参数) => 返回值
     *
     * 外层函数接收 Store 的 state；
     * 内层函数接收需要检查的权限标识。
     *
     * 使用示例：
     * authStore.hasPermission('user:create')
     *
     * 返回 true：permissions 中包含该权限。
     * 返回 false：permissions 中不包含该权限。
     */
    getters: {
        // 将权限码集合暴露为按钮和页面可复用的检查方法。
        hasPermission: (state) => (permission) => state.permissions.includes(permission),
    },

    // ========================================================
    // 四、定义操作方法 actions
    // ========================================================

    /**
     * actions 用于定义业务操作。
     *
     * 可以在 actions 中：
     * 1. 访问和修改 state。
     * 2. 调用后端 API。
     * 3. 编写异步业务逻辑。
     *
     * 登录、加载用户信息和退出登录等操作，
     * 都统一放在这里管理。
     */
    actions: {

        // ----------------------------------------------------
        // 4.1 获取当前登录用户的信息及权限
        // ----------------------------------------------------
        async loadCurrentUser() {
            // 每次应用恢复登录态时重新从后端读取权限，避免只信任浏览器缓存。
            // 调用后端接口获取当前用户信息。
            // 解构出响应对象中的 data 字段。
            const {data} = await request.get('/auth/me')
            this.user = data.user
            this.menus = data.menus
            this.permissions = data.permissions
            this.loaded = true
            return data
        },

        // ----------------------------------------------------
        // 4.2 用户登录
        // ----------------------------------------------------
        async login(username, password) {
            // 登录成功后立即读取用户资料和当前可用权限。
            try {
                const { data } = await request.post('/auth/login', {
                    username,
                    password,
                })

                if (!data?.access_token || data?.code === 401) {
                    throw new Error('账号密码错误')
                }

                localStorage.setItem('access_token', data.access_token)
                this.loaded = false

                return await this.loadCurrentUser()
            } catch (error) {
                localStorage.removeItem('access_token')
                this.user = null
                this.menus = []
                this.permissions = []
                this.loaded = false
                throw error
            }
        },

        // ----------------------------------------------------
        // 4.3 用户退出登录
        // ----------------------------------------------------
        logout() {
            // 单 JWT 模式通过删除本地令牌完成退出。
            localStorage.removeItem('access_token')
            this.user = null
            this.menus = []
            this.permissions = []
            this.loaded = false
        },
    },
})
