import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import i18n from '../i18n'

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    const { t, te } = i18n.global
    const status: number | undefined = error.response?.status
    const code: string | undefined = error.response?.data?.code

    // Token 缺失或失效：清理本地登录态并跳转登录页
    // （登录失败返回的是 INVALID_CREDENTIALS，不走此分支）
    if (status === 401 && code === 'UNAUTHORIZED') {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      ElMessage.error(t('errors.UNAUTHORIZED'))
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
      return Promise.reject(error)
    }

    let message: string
    if (status === 400 && code === 'VALIDATION_FAILED') {
      // 参数校验失败：优先展示首条字段错误的稳定码
      const first = error.response?.data?.errors?.[0] as { field: string; code: string } | undefined
      message = first && te(`errors.${first.code}`) ? t(`errors.${first.code}`) : t('errors.VALIDATION_FAILED')
    } else if (code && te(`errors.${code}`)) {
      message = t(`errors.${code}`)
    } else if (status) {
      message = t('errors.INTERNAL_ERROR')
    } else {
      message = t('errors.NETWORK_ERROR')
    }
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default service
