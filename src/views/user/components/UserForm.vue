<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserManageStore } from '../../../stores/user-manage'
import type { User } from '../../../types/user-manage'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
  userId: string | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  success: []
}>()

const { t, locale } = useI18n()
const userManageStore = useUserManageStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const isEdit = ref(false)

const form = reactive<User>({
  username: '',
  email: '',
  password: '',
  role: 0,
  status: 1,
})

const rules = reactive<FormRules>({
  username: [{ required: true, message: () => t('userManage.usernameRequired'), trigger: 'blur' }],
  email: [
    { required: true, message: () => t('userManage.emailRequired'), trigger: 'blur' },
    { type: 'email', message: () => t('userManage.emailInvalid'), trigger: 'blur' },
  ],
  password: [
    {
      required: true,
      message: () => t('userManage.passwordRequired'),
      trigger: 'blur',
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (!isEdit.value && (!value || value.length < 6)) {
          callback(new Error(t('userManage.passwordMinLength')))
        } else {
          callback()
        }
      },
    },
  ],
  role: [{ required: true, message: () => t('userManage.roleRequired'), trigger: 'change' }],
  status: [{ required: true, message: () => t('userManage.statusRequired'), trigger: 'change' }],
})

const roleOptions = computed(() => {
  locale.value
  return [
    { label: t('userManage.roleMap.0'), value: 0 },
    { label: t('userManage.roleMap.1'), value: 1 },
    { label: t('userManage.roleMap.2'), value: 2 },
  ]
})

const statusOptions = computed(() => {
  locale.value
  return [
    { label: t('userManage.statusMap.0'), value: 0 },
    { label: t('userManage.statusMap.1'), value: 1 },
  ]
})

function resetForm() {
  form.username = ''
  form.email = ''
  form.password = ''
  form.role = 0
  form.status = 1
}

async function loadUser() {
  if (!props.userId) return
  loading.value = true
  try {
    const data = await userManageStore.getById(props.userId)
    Object.assign(form, { ...data, password: '' })
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    if (props.userId) {
      const submitData: User = { ...form }
      if (!submitData.password) delete submitData.password
      await userManageStore.update(props.userId, submitData)
    } else {
      await userManageStore.create({ ...form })
    }
    ElMessage.success(t('common.confirm'))
    emit('success')
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
      isEdit.value = !!props.userId
      loadUser()
    }
  },
)
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    :title="props.userId ? t('userManage.edit') : t('userManage.add')"
    width="500px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" v-loading="loading">
      <el-form-item :label="t('userManage.username')" prop="username">
        <el-input v-model="form.username" :disabled="isEdit" />
      </el-form-item>
      <el-form-item :label="t('userManage.email')" prop="email">
        <el-input v-model="form.email" />
      </el-form-item>
      <el-form-item :label="t('userManage.password')" prop="password">
        <el-input v-model="form.password" type="password" show-password :placeholder="isEdit ? t('userManage.passwordPlaceholder') : ''" />
      </el-form-item>
      <el-form-item :label="t('userManage.role')" prop="role">
        <el-select :key="locale" v-model="form.role" style="width: 100%">
          <el-option
            v-for="opt in roleOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('userManage.status')" prop="status">
        <el-select :key="locale" v-model="form.status" style="width: 100%">
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>
