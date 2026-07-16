import request from '../utils/request'
import type { UserInfo, ApiResponse } from '../types/user'

export function login(params: { username: string; password: string }) {
  return request.post('/auth/login', params) as Promise<ApiResponse<{ token: string; user: UserInfo }>>
}

export function register(params: { username: string; email: string; password: string }) {
  return request.post('/auth/register', params) as Promise<ApiResponse<void>>
}
