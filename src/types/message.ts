export interface MessageResponse {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdTime: string
  senderName: string
  receiverName: string
}

export interface ConversationResponse {
  userId: string
  userName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export interface MessageCreateRequest {
  receiverId: string
  content: string
}

export interface PageResponse<T> {
  records: T[]
  total: number
  page: number
  size: number
  totalPages: number
}
