<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../../stores/user'
import { useMessageStore } from '../../stores/message'
import { ChatDotRound, Promotion } from '@element-plus/icons-vue'

const { t } = useI18n()
const userStore = useUserStore()
const messageStore = useMessageStore()

const inputMessage = ref('')
const scrollbarRef = ref()
const loadingOlder = ref(false)
const noMoreHistory = ref(false)

onMounted(async () => {
  await messageStore.fetchConversations()
  if (messageStore.currentChatUserId) {
    const conv = messageStore.conversations.find((c) => c.userId === messageStore.currentChatUserId)
    if (conv) {
      await messageStore.fetchChatHistory(messageStore.currentChatUserId)
      await messageStore.markAsRead(messageStore.currentChatUserId)
    } else {
      await messageStore.openChat(messageStore.currentChatUserId)
    }
    noMoreHistory.value = messageStore.chatMessages.length >= messageStore.chatTotal
    nextTick(() => {
      scrollToBottom()
      autoLoadIfNotScrollable()
    })
  }
})

const myUserId = computed(() => String(userStore.userInfo?.id ?? ''))

const currentUserName = computed(() => {
  const conv = messageStore.conversations.find((c) => c.userId === messageStore.currentChatUserId)
  return conv?.userName ?? messageStore.currentChatUserName ?? ''
})

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
  if (days === 1) return t('message.yesterday')
  if (days < 7) return `${days}天前`
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

async function handleSelectConv(userId: string) {
  noMoreHistory.value = false
  await messageStore.openChat(userId)
  noMoreHistory.value = messageStore.chatMessages.length >= messageStore.chatTotal
  nextTick(() => {
    scrollToBottom()
    autoLoadIfNotScrollable()
  })
}

function scrollToBottom() {
  if (scrollbarRef.value) {
    const wrapRef = scrollbarRef.value.wrapRef
    if (wrapRef) {
      wrapRef.scrollTop = wrapRef.scrollHeight
    }
  }
}

async function autoLoadIfNotScrollable() {
  const wrapRef = scrollbarRef.value?.wrapRef
  if (!wrapRef) return
  while (wrapRef.scrollHeight <= wrapRef.clientHeight && !noMoreHistory.value && !messageStore.chatLoading) {
    await messageStore.loadMoreHistory(messageStore.currentChatUserId!)
    noMoreHistory.value = messageStore.chatMessages.length >= messageStore.chatTotal
    await nextTick()
  }
  scrollToBottom()
}

async function handleChatScroll({ scrollTop }: { scrollTop: number }) {
  if (scrollTop > 10) return
  if (messageStore.chatLoading) return
  if (!messageStore.currentChatUserId) return
  if (noMoreHistory.value) return

  const wrapRef = scrollbarRef.value?.wrapRef
  if (!wrapRef) return

  loadingOlder.value = true
  const prevHeight = wrapRef.scrollHeight
  await messageStore.loadMoreHistory(messageStore.currentChatUserId)
  noMoreHistory.value = messageStore.chatMessages.length >= messageStore.chatTotal
  nextTick(() => {
    wrapRef.scrollTop = wrapRef.scrollHeight - prevHeight
    loadingOlder.value = false
  })
}

async function handleSend() {
  const content = inputMessage.value.trim()
  if (!content || !messageStore.currentChatUserId) return
  await messageStore.send(messageStore.currentChatUserId, content)
  inputMessage.value = ''
  nextTick(scrollToBottom)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleMarkAllRead() {
  messageStore.markAllAsRead()
}

watch(() => messageStore.chatMessages.length, () => {
  if (loadingOlder.value) return
  nextTick(scrollToBottom)
})
</script>

<template>
  <div class="message-page">
    <div class="message-container">
      <div class="conversations-panel">
        <div class="panel-header">
          <h3>{{ t('message.conversations') }}</h3>
          <el-button text size="small" @click="handleMarkAllRead">
            {{ t('message.markAllRead') }}
          </el-button>
        </div>
        <div class="conv-list">
          <div v-if="messageStore.conversations.length === 0" class="empty-conv">
            <el-empty :description="t('message.noConversations')" :image-size="80" />
          </div>
          <div
            v-for="conv in messageStore.conversations"
            :key="conv.userId"
            class="conv-item"
            :class="{ active: messageStore.currentChatUserId === conv.userId }"
            @click="handleSelectConv(conv.userId)"
          >
            <div class="conv-avatar">
              <el-avatar :size="40" style="background-color: #409eff;">
                {{ conv.userName?.charAt(0) }}
              </el-avatar>
              <span v-if="conv.unreadCount > 0" class="unread-badge">{{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}</span>
            </div>
            <div class="conv-info">
              <div class="conv-top">
                <span class="conv-name">{{ conv.userName }}</span>
                <span class="conv-time">{{ formatTime(conv.lastMessageTime) }}</span>
              </div>
              <div class="conv-last">{{ conv.lastMessage }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-panel">
        <template v-if="messageStore.currentChatUserId">
          <div class="chat-header">
            <span>{{ currentUserName }}</span>
          </div>
          <el-scrollbar ref="scrollbarRef" class="chat-body" @scroll="handleChatScroll">
            <div class="chat-content">
              <div v-if="noMoreHistory && messageStore.chatMessages.length > 0" class="chat-no-more">
                {{ t('message.noMoreHistory') }}
              </div>
              <div v-if="loadingOlder" class="chat-loading-older">
                <el-icon class="is-loading"><ChatDotRound /></el-icon>
              </div>
            <div v-if="messageStore.chatLoading && messageStore.chatMessages.length === 0" class="chat-loading">
              <el-icon class="is-loading"><ChatDotRound /></el-icon>
            </div>
            <div v-if="!messageStore.chatLoading && messageStore.chatMessages.length === 0" class="chat-empty">
              <el-empty :description="t('message.noMessages')" :image-size="60" />
            </div>
            <div
              v-for="msg in messageStore.chatMessages"
              :key="msg.id"
              class="chat-bubble"
              :class="{ mine: String(msg.senderId) === myUserId }"
            >
              <div class="bubble-name">{{ String(msg.senderId) === myUserId ? userStore.userInfo?.username : msg.senderName }}</div>
              <div class="bubble-content">{{ msg.content }}</div>
              <div class="bubble-time">{{ formatMessageTime(msg.createdTime) }}</div>
            </div>
            </div>
          </el-scrollbar>
          <div class="chat-input">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="2"
              :placeholder="t('message.inputPlaceholder')"
              resize="none"
              @keydown="handleKeydown"
            />
            <el-button type="primary" :icon="Promotion" :disabled="!inputMessage.trim()" @click="handleSend">
              {{ t('message.send') }}
            </el-button>
          </div>
        </template>
        <div v-else class="chat-placeholder">
          <el-empty :description="t('message.noConversations')" :image-size="120" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-page {
  height: 100%;
}
.message-container {
  display: flex;
  height: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
  border: 1px solid #f3f4f6;
}
.conversations-panel {
  width: 320px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.panel-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}
.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.conv-list {
  flex: 1;
  overflow-y: auto;
}
.empty-conv {
  padding: 40px 0;
}
.conv-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid #f9fafb;
}
.conv-item:hover {
  background-color: #f9fafb;
}
.conv-item.active {
  background-color: #eff6ff;
}
.conv-avatar {
  position: relative;
  flex-shrink: 0;
}
.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  font-weight: 600;
}
.conv-info {
  flex: 1;
  min-width: 0;
}
.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.conv-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conv-time {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
  margin-left: 8px;
}
.conv-last {
  font-size: 13px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.chat-header {
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  border-bottom: 1px solid #f0f0f0;
}
.chat-body {
  flex: 1;
  overflow: hidden;
}
.chat-content {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chat-loading, .chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}
.chat-loading-older {
  display: flex;
  justify-content: center;
  padding: 4px 0;
  color: #9ca3af;
  font-size: 18px;
}
.chat-no-more {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  padding: 8px 0;
}
.chat-bubble {
  max-width: 65%;
  align-self: flex-start;
}
.chat-bubble.mine {
  align-self: flex-end;
}
.bubble-name {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}
.mine .bubble-name {
  text-align: right;
}
.bubble-content {
  background: #f3f4f6;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  word-break: break-word;
}
.mine .bubble-content {
  background: #3b82f6;
  color: #fff;
}
.bubble-time {
  font-size: 11px;
  color: #d1d5db;
  margin-top: 4px;
}
.mine .bubble-time {
  text-align: right;
}
.chat-input {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}
.chat-input :deep(.el-textarea__inner) {
  border-radius: 8px;
}
.chat-input .el-button {
  border-radius: 8px;
  height: 54px;
}
.chat-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
