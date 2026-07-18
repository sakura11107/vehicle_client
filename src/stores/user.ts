import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth'
import type { UserInfo } from '../types/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  try {
    const saved = localStorage.getItem('userInfo')
    if (saved) userInfo.value = JSON.parse(saved)
  } catch {}

  const isLoggedIn = computed(() => !!token.value)

  /** 当前用户 ID，未登录为 null */
  const currentUserId = computed(() => userInfo.value?.id ?? null)

  /** 系统管理员（role=2） */
  const isAdmin = computed(() => userInfo.value?.role === 2)

  /** 车辆管理员或系统管理员（role>=1） */
  const isManagerOrAdmin = computed(() => (userInfo.value?.role ?? 0) >= 1)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function clearToken() {
    token.value = ''
    localStorage.removeItem('token')
  }

  async function login(params: { username: string; password: string }) {
    const res = await authApi.login(params)
    setToken(res.data.token)
    userInfo.value = res.data.user
    localStorage.setItem('userInfo', JSON.stringify(res.data.user))
    return res
  }

  async function register(params: { username: string; email: string; password: string }) {
    const res = await authApi.register(params)
    return res
  }

  function logout() {
    clearToken()
    userInfo.value = null
    localStorage.removeItem('userInfo')
  }

  return { token, userInfo, isLoggedIn, currentUserId, isAdmin, isManagerOrAdmin, setToken, clearToken, login, register, logout }
})
