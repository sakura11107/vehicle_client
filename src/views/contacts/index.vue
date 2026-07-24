<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../../stores/user'
import { useMessageStore } from '../../stores/message'
import { getContactTree, getUsersByRole, searchContacts } from '../../api/contacts'
import type { ContactGroup, ContactUser } from '../../types/contacts'
import { Search, ChatDotRound, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const messageStore = useMessageStore()

const groups = ref<ContactGroup[]>([])
const activeGroups = ref<number[]>([])
const groupUsers = ref<Record<number, ContactUser[]>>({})
const loadingUsers = ref<Record<number, boolean>>({})
const searchKeyword = ref('')
const searchResults = ref<ContactUser[]>([])
const isSearching = ref(false)
const searchLoading = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  await fetchGroups()
})

async function fetchGroups() {
  try {
    const res = await getContactTree()
    groups.value = res.data
  } catch (error) {
    console.error('Failed to fetch contact groups:', error)
  }
}

async function handleGroupChange(active: number[]) {
  activeGroups.value = active
  for (const role of active) {
    if (!groupUsers.value[role]) {
      await fetchGroupUsers(role)
    }
  }
}

async function fetchGroupUsers(role: number) {
  loadingUsers.value[role] = true
  try {
    const res = await getUsersByRole(role)
    groupUsers.value[role] = res.data
  } catch (error) {
    console.error('Failed to fetch group users:', error)
  } finally {
    loadingUsers.value[role] = false
  }
}

function handleSearchInput() {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    isSearching.value = false
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searchLoading.value = true
    isSearching.value = true
    try {
      const res = await searchContacts(keyword)
      searchResults.value = res.data
    } catch (error) {
      console.error('Failed to search contacts:', error)
    } finally {
      searchLoading.value = false
    }
  }, 300)
}

function goToChat(userId: string) {
  if (userId === userStore.currentUserId) {
    ElMessage.warning(t('contacts.cannotChatWithSelf'))
    return
  }
  const user = [...searchResults.value, ...Object.values(groupUsers.value).flat()].find((u) => u.id === userId)
  const userName = user?.username || `User ${userId}`
  messageStore.currentChatUserId = userId
  messageStore.currentChatUserName = userName
  messageStore.ensureConversation(userId, userName)
  router.push('/message')
}
</script>

<template>
  <div class="contacts-page">
    <div class="contacts-container">
      <div class="contacts-header">
        <h3>{{ t('contacts.title') }}</h3>
      </div>

      <div class="search-wrapper">
        <el-input
          v-model="searchKeyword"
          :placeholder="t('contacts.searchPlaceholder')"
          :prefix-icon="Search"
          clearable
          @input="handleSearchInput"
        />
      </div>

      <div class="contacts-body">
        <template v-if="isSearching">
          <div v-if="searchLoading" class="loading-wrapper">
            <el-icon class="is-loading"><ChatDotRound /></el-icon>
          </div>
          <template v-else>
            <div v-if="searchResults.length === 0" class="empty-wrapper">
              <el-empty :description="t('contacts.noSearchResult')" :image-size="60" />
            </div>
            <div v-else class="user-list">
              <div
                v-for="user in searchResults"
                :key="user.id"
                class="user-item"
                @click="goToChat(user.id)"
              >
                <div class="user-avatar">
                  <el-avatar :size="36" style="background-color: #409eff;">
                    {{ user.username?.charAt(0) }}
                  </el-avatar>
                  <span class="online-dot" :class="{ online: user.online }"></span>
                </div>
                <div class="user-info">
                  <span class="user-name">{{ user.username }}</span>
                  <span class="user-role">{{ user.roleName }}</span>
                </div>
                <el-button type="primary" text :icon="ChatDotRound" size="small">
                  {{ t('contacts.sendMessage') }}
                </el-button>
              </div>
            </div>
          </template>
        </template>

        <template v-else>
          <div v-if="groups.length === 0" class="empty-wrapper">
            <el-empty :description="t('contacts.noContacts')" :image-size="80" />
          </div>
          <el-collapse v-else v-model="activeGroups" @change="handleGroupChange">
            <el-collapse-item
              v-for="group in groups"
              :key="group.role"
              :name="group.role"
            >
              <template #title>
                <div class="group-header">
                  <el-icon><User /></el-icon>
                  <span class="group-name">{{ group.groupName }}</span>
                  <span class="group-count">
                    {{ group.userCount }}{{ t('contacts.people') }}
                    · {{ group.onlineCount }}{{ t('contacts.online') }}
                  </span>
                </div>
              </template>
              <div v-if="loadingUsers[group.role]" class="loading-wrapper">
                <el-icon class="is-loading"><ChatDotRound /></el-icon>
              </div>
              <div v-else-if="groupUsers[group.role]?.length" class="user-list">
                <div
                  v-for="user in groupUsers[group.role]"
                  :key="user.id"
                  class="user-item"
                  @click="goToChat(user.id)"
                >
                  <div class="user-avatar">
                    <el-avatar :size="36" style="background-color: #409eff;">
                      {{ user.username?.charAt(0) }}
                    </el-avatar>
                    <span class="online-dot" :class="{ online: user.online }"></span>
                  </div>
                  <div class="user-info">
                    <span class="user-name">{{ user.username }}</span>
                    <span class="user-role">{{ user.roleName }}</span>
                  </div>
                  <el-button type="primary" text :icon="ChatDotRound" size="small">
                    {{ t('contacts.sendMessage') }}
                  </el-button>
                </div>
              </div>
              <div v-else class="empty-wrapper">
                <el-empty :description="t('contacts.noMembers')" :image-size="48" />
              </div>
            </el-collapse-item>
          </el-collapse>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contacts-page {
  height: 100%;
}
.contacts-container {
  height: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
}
.contacts-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.contacts-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.search-wrapper {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.contacts-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.group-name {
  font-weight: 500;
  color: #303133;
}
.group-count {
  font-size: 12px;
  color: #9ca3af;
  font-weight: normal;
}
.user-list {
  padding: 4px 0;
}
.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.15s;
}
.user-item:hover {
  background-color: #f9fafb;
}
.user-avatar {
  position: relative;
  flex-shrink: 0;
}
.online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d1d5db;
  border: 2px solid #fff;
}
.online-dot.online {
  background: #22c55e;
}
.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}
.user-role {
  font-size: 12px;
  color: #9ca3af;
}
.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 20px;
}
.empty-wrapper {
  padding: 24px;
}
:deep(.el-collapse-item__header) {
  padding: 0 20px;
  height: 48px;
  line-height: 48px;
}
:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
:deep(.el-collapse-item__wrap) {
  border-bottom: none;
}
</style>
