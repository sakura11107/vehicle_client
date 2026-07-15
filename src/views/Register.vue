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
  email: '',
  password: '',
  confirmPassword: '',
})

function validateConfirmPassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value !== form.password) {
    callback(new Error(t('register.confirmPasswordMismatch')))
  } else {
    callback()
  }
}

const rules = reactive<FormRules>({
  username: [
    { required: true, message: () => t('register.usernameRequired'), trigger: 'blur' },
  ],
  email: [
    { required: true, message: () => t('register.emailRequired'), trigger: 'blur' },
    { type: 'email', message: () => t('register.emailInvalid'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: () => t('register.passwordRequired'), trigger: 'blur' },
    { min: 6, message: () => t('register.passwordMinLength'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: () => t('register.confirmPasswordRequired'), trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
})

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.register({
      username: form.username,
      email: form.email,
      password: form.password,
    })
    router.push('/login')
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
      <h2 class="auth-title">{{ t('register.title') }}</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" @submit.prevent="handleRegister">
        <el-form-item :label="t('register.username')" prop="username">
          <el-input v-model="form.username" :placeholder="t('register.usernamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('register.email')" prop="email">
          <el-input v-model="form.email" :placeholder="t('register.emailPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('register.password')" prop="password">
          <el-input v-model="form.password" type="password" show-password :placeholder="t('register.passwordPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('register.confirmPassword')" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password :placeholder="t('register.confirmPasswordPlaceholder')" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="auth-btn" @click="handleRegister">
            {{ t('register.registerBtn') }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-link">
        {{ t('register.hasAccount') }}
        <router-link to="/login">{{ t('register.goToLogin') }}</router-link>
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
