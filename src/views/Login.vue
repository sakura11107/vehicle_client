<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = reactive<FormRules>({
  username: [
    { required: true, message: () => t('login.usernameRequired'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: () => t('login.passwordRequired'), trigger: 'blur' },
    { min: 6, message: () => t('login.passwordMinLength'), trigger: 'blur' },
  ],
})

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login({
      username: form.username,
      password: form.password,
    })
    router.push('/')
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <el-card class="auth-card">
      <h2 class="auth-title">{{ t('login.title') }}</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" @submit.prevent="handleLogin">
        <el-form-item :label="t('login.username')" prop="username">
          <el-input v-model="form.username" :placeholder="t('login.usernamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('login.password')" prop="password">
          <el-input v-model="form.password" type="password" show-password :placeholder="t('login.passwordPlaceholder')" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="auth-btn" @click="handleLogin">
            {{ t('login.loginBtn') }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-link">
        {{ t('login.noAccount') }}
        <router-link to="/register">{{ t('login.goToRegister') }}</router-link>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}
.auth-card {
  width: 420px;
  padding: 20px;
}
.auth-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}
.auth-btn {
  width: 100%;
}
.auth-link {
  text-align: center;
  font-size: 14px;
  color: #909399;
}
.auth-link a {
  color: #409eff;
  text-decoration: none;
}
</style>
