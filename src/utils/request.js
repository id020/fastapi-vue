import axios from "axios";

// 创建axios实例
export const request = axios.create({ baseURL: '/api', timeout: 30000 })

// 请求拦截器
request.interceptors.request.use((config) => {
    // 每个已登录请求都携带单 JWT 访问令牌。
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// 返回拦截器
request.interceptors.response.use(
    (response) => response,
    (error) => {
        // 令牌失效时清理本地登录状态，路由守卫会引导用户重新登录。
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token')
            if (window.location.pathname !== '/login') window.location.assign('/login')
        }
        return Promise.reject(error)
    },
)

export function errorMessage(error) {
    // 优先展示后端给出的中文错误说明。
    return error.response?.data?.detail || error.message || '请求失败，请稍后重试'
}