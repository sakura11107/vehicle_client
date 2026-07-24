import request from '../utils/request'
import type { MessageResponse, ConversationResponse, MessageCreateRequest, PageResponse } from '../types/message'
import type { ApiResponse } from '../types/user'

export function getConversations(page = 1, size = 20) {
  return request.get('/messages/conversations', { params: { page, size } }) as Promise<ApiResponse<PageResponse<ConversationResponse>>>
}

export function getUnreadCount() {
  return request.get('/messages/unread-count') as Promise<ApiResponse<number>>
}

export function getChatHistory(userId: string, page = 1, size = 10) {
  return request.get(`/messages/${userId}`, { params: { page, size } }) as Promise<ApiResponse<PageResponse<MessageResponse>>>
}

export function sendMessage(data: MessageCreateRequest) {
  return request.post('/messages', data) as Promise<ApiResponse<MessageResponse>>
}

export function markAsRead(userId: string) {
  return request.put(`/messages/${userId}/read`) as Promise<ApiResponse<void>>
}

export function markAllAsRead() {
  return request.put('/messages/read-all') as Promise<ApiResponse<void>>
}
