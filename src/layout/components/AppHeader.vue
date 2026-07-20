<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../../stores/user'
import { useMessageStore } from '../../stores/message'
import { Fold, Expand, ArrowDown, Message as MessageIcon } from '@element-plus/icons-vue'

const props = defineProps<{
  isCollapse: boolean
}>()

const emit = defineEmits<{
  toggleCollapse: []
}>()

const router = useRouter()
const { t, locale } = useI18n()
const userStore = useUserStore()
const messageStore = useMessageStore()

const MAX_DISPLAY_COUNT = 5

const unreadConversations = computed(() => {
  return messageStore.conversations
    .filter((c) => c.unreadCount > 0)
    .slice(0, MAX_DISPLAY_COUNT)
})

function toggleLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

async function handleOpenDropdown(visible: boolean) {
  if (visible && userStore.isLoggedIn) {
    await messageStore.fetchConversations()
  }
}

function goToMessage() {
  router.push('/message')
}

function goToConversation(userId: number) {
  messageStore.currentChatUserId = userId
  router.push('/message')
}

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
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

function handleLogout() {
  messageStore.disconnectWs()
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    messageStore.fetchUnreadCount()
  }
})
</script>

<template>
  <div class="header-left">
    <el-icon class="collapse-btn" @click="emit('toggleCollapse')">
      <Fold v-if="!props.isCollapse" />
      <Expand v-else />
    </el-icon>
    <span class="system-title">{{ t('layout.title') }}</span>
  </div>
  <div class="header-right">
    <el-dropdown trigger="click">
      <el-button text>
        {{ locale === 'zh-CN' ? '中文' : 'English' }}
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item :disabled="locale === 'zh-CN'" @click="toggleLang('zh-CN')">
            中文
          </el-dropdown-item>
          <el-dropdown-item :disabled="locale === 'en-US'" @click="toggleLang('en-US')">
            English
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-dropdown trigger="click" @visible-change="handleOpenDropdown">
      <el-badge :value="messageStore.unreadCount" :hidden="messageStore.unreadCount === 0" :max="99">
        <el-icon class="message-btn"><MessageIcon /></el-icon>
      </el-badge>
      <template #dropdown>
        <el-dropdown-menu class="message-dropdown">
          <div class="dropdown-header">
            <span>{{ t('message.unreadMessages') }}</span>
            <el-button text size="small" @click.stop="goToMessage">{{ t('message.viewAll') }}</el-button>
          </div>
          <template v-if="unreadConversations.length > 0">
            <el-dropdown-item
              v-for="conv in unreadConversations"
              :key="conv.userId"
              @click="goToConversation(conv.userId)"
            >
              <div class="dropdown-msg-item">
                <el-avatar :size="32" style="background-color: #409eff; flex-shrink: 0;">
                  {{ conv.userName?.charAt(0) }}
                </el-avatar>
                <div class="dropdown-msg-info">
                  <div class="dropdown-msg-top">
                    <span class="dropdown-msg-name">{{ conv.userName }}</span>
                    <span class="dropdown-msg-time">{{ formatTime(conv.lastMessageTime) }}</span>
                  </div>
                  <div class="dropdown-msg-content">{{ conv.lastMessage }}</div>
                </div>
                <span class="dropdown-msg-badge">{{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}</span>
              </div>
            </el-dropdown-item>
          </template>
          <div v-else class="dropdown-empty">
            <el-empty :description="t('message.noUnread')" :image-size="48" />
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-dropdown trigger="click">
      <span class="user-info">
        {{ userStore.userInfo?.username || 'User' }}
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item>{{ t('layout.profile') }}</el-dropdown-item>
          <el-dropdown-item divided @click="handleLogout">
            {{ t('layout.logout') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #303133;
}
.collapse-btn:hover {
  color: #409eff;
}
.system-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.message-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}
.message-btn:hover {
  color: #409eff;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #303133;
}
.message-dropdown {
  width: 320px;
}
.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #f0f0f0;
}
.dropdown-msg-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.dropdown-msg-info {
  flex: 1;
  min-width: 0;
}
.dropdown-msg-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}
.dropdown-msg-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}
.dropdown-msg-time {
  font-size: 11px;
  color: #9ca3af;
  flex-shrink: 0;
}
.dropdown-msg-content {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropdown-msg-badge {
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
  flex-shrink: 0;
}
.dropdown-empty {
  padding: 20px 0;
}
</style>
