<script setup lang="ts">
import { onMounted } from 'vue'
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

function toggleLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

function goToMessage() {
  router.push('/message')
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
    <el-badge :value="messageStore.unreadCount" :hidden="messageStore.unreadCount === 0" :max="99">
      <el-icon class="message-btn" @click="goToMessage"><MessageIcon /></el-icon>
    </el-badge>
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
</style>
