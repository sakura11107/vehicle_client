export interface MessageResponse {
  id: number
  senderId: number
  receiverId: number
  content: string
  isRead: boolean
  createdTime: string
  senderName: string
  receiverName: string
}

export interface ConversationResponse {
  userId: number
  userName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export interface MessageCreateRequest {
  receiverId: number
  content: string
}

export interface PageResponse<T> {
  records: T[]
  total: number
  page: number
  size: number
  totalPages: number
}
