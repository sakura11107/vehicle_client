import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as messageApi from '../api/message'
import type { ConversationResponse, MessageResponse } from '../types/message'
import { connectWebSocket, disconnectWebSocket } from '../utils/websocket'

export const useMessageStore = defineStore('message', () => {
  const conversations = ref<ConversationResponse[]>([])
  const unreadCount = ref(0)
  const currentChatUserId = ref<number | null>(null)
  const currentChatUserName = ref<string>('')
  const chatMessages = ref<MessageResponse[]>([])
  const chatTotal = ref(0)
  const chatPage = ref(1)
  const chatLoading = ref(false)

  function connectWs(token: string) {
    connectWebSocket(token, (msg) => {
      unreadCount.value++
      const conv = conversations.value.find((c) => c.userId === msg.senderId)
      if (conv) {
        conv.lastMessage = msg.content
        conv.lastMessageTime = msg.createdTime
        conv.unreadCount++
      } else {
        conversations.value.unshift({
          userId: msg.senderId,
          userName: msg.senderName,
          lastMessage: msg.content,
          lastMessageTime: msg.createdTime,
          unreadCount: 1,
        })
      }
      if (currentChatUserId.value === msg.senderId) {
        chatMessages.value.push(msg)
      }
    })
  }

  function disconnectWs() {
    disconnectWebSocket()
  }

  async function fetchConversations() {
    const res = await messageApi.getConversations()
    // 合并：后端会话更新本地已有的，保留本地独有的在开头
    const serverConvs = res.data.records
    const merged = [...conversations.value]
    for (const serverConv of serverConvs) {
      const index = merged.findIndex((local) => local.userId === serverConv.userId)
      if (index >= 0) {
        // 本地已有，用后端数据更新
        merged[index] = serverConv
      } else {
        // 后端有本地没有，添加到末尾
        merged.push(serverConv)
      }
    }
    conversations.value = merged
  }

  async function fetchUnreadCount() {
    const res = await messageApi.getUnreadCount()
    unreadCount.value = res.data
  }

  async function fetchChatHistory(userId: number, append = false) {
    if (!append) {
      chatPage.value = 1
      chatMessages.value = []
    }
    chatLoading.value = true
    try {
      const res = await messageApi.getChatHistory(userId, chatPage.value)
      const records = [...res.data.records].reverse()
      if (append) {
        chatMessages.value = [...records, ...chatMessages.value]
      } else {
        chatMessages.value = records
      }
      chatTotal.value = res.data.total
    } catch (error) {
      if (!append) {
        chatMessages.value = []
      }
      throw error
    } finally {
      chatLoading.value = false
    }
  }

  async function loadMoreHistory(userId: number) {
    if (chatMessages.value.length >= chatTotal.value) return
    chatPage.value++
    await fetchChatHistory(userId, true)
  }

  async function send(userId: number, content: string) {
    const res = await messageApi.sendMessage({ receiverId: userId, content })
    const msg = res.data
    chatMessages.value.push(msg)
    const conv = conversations.value.find((c) => c.userId === userId)
    if (conv) {
      conv.lastMessage = msg.content
      conv.lastMessageTime = msg.createdTime
    } else {
      conversations.value.unshift({
        userId,
        userName: msg.receiverName,
        lastMessage: msg.content,
        lastMessageTime: msg.createdTime,
        unreadCount: 0,
      })
    }
  }

  async function markAsRead(userId: number) {
    const conv = conversations.value.find((c) => c.userId === userId)
    const countToDecrement = conv ? conv.unreadCount : 0
    await messageApi.markAsRead(userId)
    if (conv) {
      unreadCount.value -= countToDecrement
      conv.unreadCount = 0
    }
  }

  async function markAllAsRead() {
    await messageApi.markAllAsRead()
    unreadCount.value = 0
    conversations.value.forEach((c) => (c.unreadCount = 0))
  }

  async function openChat(userId: number) {
    currentChatUserId.value = userId
    try {
      await fetchChatHistory(userId)
      await markAsRead(userId)
      // 确保会话存在
      const exists = conversations.value.find((c) => c.userId === userId)
      if (!exists) {
        // 从聊天消息中获取用户名，或使用当前设置的用户名
        let name = currentChatUserName.value
        if (!name && chatMessages.value.length > 0) {
          const msg = chatMessages.value[0]
          name = msg.senderId === userId ? msg.senderName : msg.receiverName
        }
        conversations.value.unshift({
          userId,
          userName: name || `User ${userId}`,
          lastMessage: chatMessages.value.length > 0 ? chatMessages.value[chatMessages.value.length - 1].content : '',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        })
      }
    } catch (error) {
      console.error('Failed to open chat:', error)
    }
  }

  function closeChat() {
    currentChatUserId.value = null
    chatMessages.value = []
  }

  function ensureConversation(userId: number, userName: string) {
    const exists = conversations.value.find((c) => c.userId === userId)
    if (!exists) {
      conversations.value.unshift({
        userId,
        userName,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      })
    }
  }

  return {
    conversations,
    unreadCount,
    currentChatUserId,
    currentChatUserName,
    chatMessages,
    chatTotal,
    chatLoading,
    connectWs,
    disconnectWs,
    fetchConversations,
    fetchUnreadCount,
    fetchChatHistory,
    loadMoreHistory,
    send,
    markAsRead,
    markAllAsRead,
    openChat,
    closeChat,
    ensureConversation,
  }
})
