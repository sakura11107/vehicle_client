import request from '../utils/request'
import type { MessageResponse, ConversationResponse, MessageCreateRequest, PageResponse } from '../types/message'

export function getConversations() {
  return request.get('/messages/conversations') as Promise<{ code: string; data: ConversationResponse[] }>
}

export function getUnreadCount() {
  return request.get('/messages/unread-count') as Promise<{ code: string; data: number }>
}

export function getChatHistory(userId: number, page = 1, size = 20) {
  return request.get(`/messages/${userId}`, { params: { page, size } }) as Promise<{ code: string; data: PageResponse<MessageResponse> }>
}

export function sendMessage(data: MessageCreateRequest) {
  return request.post('/messages', data) as Promise<{ code: string; data: MessageResponse }>
}

export function markAsRead(userId: number) {
  return request.put(`/messages/${userId}/read`) as Promise<{ code: string; data: void }>
}

export function markAllAsRead() {
  return request.put('/messages/read-all') as Promise<{ code: string; data: void }>
}
