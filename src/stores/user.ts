import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth'
import type { UserInfo } from '../types/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const roleText = computed(() => {
    const roles = ['普通用户', '车辆管理员', '系统管理员']
    return roles[userInfo.value?.role ?? 0] ?? '未知'
  })

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
    return res
  }

  async function register(params: { username: string; email: string; password: string }) {
    const res = await authApi.register(params)
    return res
  }

  function logout() {
    clearToken()
    userInfo.value = null
  }

  return { token, userInfo, isLoggedIn, roleText, setToken, clearToken, login, register, logout }
})
