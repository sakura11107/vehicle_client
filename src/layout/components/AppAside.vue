<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  HomeFilled,
  User,
  Platform,
  Calendar,
  Message,
  Notebook,
} from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'

defineProps<{
  isCollapse: boolean
}>()

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

function handleMenuSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <div class="aside-logo">
    <img src="../../assets/vite.svg" alt="Logo" class="logo-img" />
    <span v-if="!isCollapse" class="logo-text">VMS</span>
  </div>
  <el-menu
    :default-active="router.currentRoute.value.path"
    :collapse="isCollapse"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409eff"
    :collapse-transition="false"
    @select="handleMenuSelect"
  >
    <el-menu-item index="/dashboard">
      <el-icon><HomeFilled /></el-icon>
      <template #title>{{ t('aside.dashboard') }}</template>
    </el-menu-item>
    <el-menu-item v-if="userStore.isManagerOrAdmin" index="/vehicle">
      <el-icon><Platform /></el-icon>
      <template #title>{{ t('aside.vehicle') }}</template>
    </el-menu-item>
    <el-menu-item v-if="userStore.isAdmin" index="/user">
      <el-icon><User /></el-icon>
      <template #title>{{ t('aside.user') }}</template>
    </el-menu-item>
    <el-menu-item index="/reservation">
      <el-icon><Calendar /></el-icon>
      <template #title>{{ t('aside.reservation') }}</template>
    </el-menu-item>
    <el-menu-item index="/contacts">
      <el-icon><Notebook /></el-icon>
      <template #title>{{ t('aside.contacts') }}</template>
    </el-menu-item>
    <el-menu-item index="/message">
      <el-icon><Message /></el-icon>
      <template #title>{{ t('aside.message') }}</template>
    </el-menu-item>
  </el-menu>
</template>

<style scoped>
.aside-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.logo-img {
  width: 32px;
  height: 32px;
}
.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}
.el-menu {
  border-right: none;
}
</style>
