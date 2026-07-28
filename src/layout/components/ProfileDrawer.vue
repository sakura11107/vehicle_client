<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../../stores/user'
import * as authApi from '../../api/auth'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessageBox } from 'element-plus'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const { t } = useI18n()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  currentPassword: '',
})

const rules = reactive<FormRules>({
  username: [{ required: true, message: () => t('profile.usernameRequired'), trigger: 'blur' }],
  email: [
    { required: true, message: () => t('profile.emailRequired'), trigger: 'blur' },
    { type: 'email', message: () => t('profile.emailInvalid'), trigger: 'blur' },
  ],
  currentPassword: [{ required: true, message: () => t('profile.currentPasswordRequired'), trigger: 'blur' }],
})

async function loadProfile() {
  loading.value = true
  try {
    const res = await authApi.getMe()
    form.username = res.data.username
    form.email = res.data.email
    form.password = ''
    form.currentPassword = ''
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const submitData: { username: string; email: string; password?: string; currentPassword: string } = {
      username: form.username,
      email: form.email,
      currentPassword: form.currentPassword,
    }
    if (form.password) {
      submitData.password = form.password
    }
    const res = await authApi.updateMe(submitData)
    userStore.updateUserInfo(res.data)

    ElMessageBox.confirm(t('profile.reloginRequired'), t('common.confirm'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    }).then(() => {
      userStore.logout()
      window.location.reload()
    }).catch(() => {})
    emit('success')
    handleClose()
  } finally {
    loading.value = false
  }
}

function handleClose() {
  form.password = ''
  form.currentPassword = ''
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadProfile()
    }
  },
)
</script>

<template>
  <el-drawer
    :model-value="props.visible"
    :title="t('profile.title')"
    size="400px"
    @close="handleClose"
  >
    <div class="profile-avatar">
      <el-avatar :size="80" style="background-color: #409eff;">
        {{ form.username?.charAt(0)?.toUpperCase() }}
      </el-avatar>
      <div class="profile-username">{{ form.username }}</div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" v-loading="loading">
      <el-form-item :label="t('profile.username')" prop="username">
        <el-input v-model="form.username" :placeholder="t('profile.usernamePlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('profile.email')" prop="email">
        <el-input v-model="form.email" :placeholder="t('profile.emailPlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('profile.newPassword')" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          :placeholder="t('profile.newPasswordPlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('profile.currentPassword')" prop="currentPassword">
        <el-input
          v-model="form.currentPassword"
          type="password"
          show-password
          :placeholder="t('profile.currentPasswordPlaceholder')"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.profile-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}
.profile-username {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
</style>
