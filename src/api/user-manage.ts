import request from '../utils/request'
import type { User, UserQuery } from '../types/user-manage'
import type { PageResult } from '../types/vehicle'
import type { ApiResponse } from '../types/user'

export function getUserList(params: UserQuery) {
  const query: Record<string, string | number> = {
    page: params.page,
    size: params.size,
  }
  if (params.username) query.username = params.username
  if (params.status !== null && params.status !== undefined) query.status = params.status

  return request.get('/users', { params: query }) as Promise<ApiResponse<PageResult<User>>>
}

export function getUserById(id: string) {
  return request.get(`/users/${id}`) as Promise<ApiResponse<User>>
}

export function createUser(data: User) {
  return request.post('/users', data) as Promise<ApiResponse<User>>
}

export function updateUser(id: string, data: User) {
  return request.put(`/users/${id}`, data) as Promise<ApiResponse<User>>
}

export function deleteUser(id: string) {
  return request.delete(`/users/${id}`) as Promise<ApiResponse<void>>
}
