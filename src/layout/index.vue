<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '../stores/user'
import { useMessageStore } from '../stores/message'
import AppHeader from './components/AppHeader.vue'
import AppAside from './components/AppAside.vue'

const isCollapse = ref(false)
const userStore = useUserStore()
const messageStore = useMessageStore()

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

function initMessage() {
  if (userStore.isLoggedIn && userStore.token) {
    messageStore.connectWs(userStore.token)
    messageStore.fetchConversations()
    messageStore.fetchUnreadCount()
  }
}

watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    initMessage()
  } else {
    messageStore.disconnectWs()
  }
})

onMounted(() => {
  initMessage()
})

onUnmounted(() => {
  messageStore.disconnectWs()
})
</script>

<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <AppHeader :is-collapse="isCollapse" @toggle-collapse="toggleCollapse" />
    </el-header>
    <el-container class="layout-body">
      <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
        <AppAside :is-collapse="isCollapse" />
      </el-aside>
      <el-main class="layout-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}
.layout-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.layout-body {
  flex: 1;
  overflow: hidden;
}
.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}
.layout-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow: auto;
}
</style>
