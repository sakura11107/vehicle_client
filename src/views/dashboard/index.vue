<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="dashboard">
    <h2>{{ t('dashboard.welcome') }}</h2>
    <p>{{ t('dashboard.description') }}</p>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}
.dashboard h2 {
  margin-bottom: 12px;
  color: #303133;
}
.dashboard p {
  color: #606266;
}
</style>
