import request from '../utils/request'
import type { ContactGroup, ContactUser } from '../types/contacts'
import type { ApiResponse } from '../types/user'

export function getContactTree() {
  return request.get('/contacts/tree') as Promise<ApiResponse<ContactGroup[]>>
}

export function getUsersByRole(role: number) {
  return request.get(`/contacts/tree/${role}/users`) as Promise<ApiResponse<ContactUser[]>>
}

export function searchContacts(keyword: string) {
  return request.get('/contacts/search', { params: { keyword } }) as Promise<ApiResponse<ContactUser[]>>
}
