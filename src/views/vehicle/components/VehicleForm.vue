<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from '../../../stores/vehicle'
import type { Vehicle } from '../../../types/vehicle'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
  vehicleId: string | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  success: []
}>()

const { t, locale } = useI18n()
const vehicleStore = useVehicleStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive<Vehicle>({
  plateNumber: '',
  brand: '',
  model: '',
  color: '',
  purchaseDate: '',
  rentStartDate: '',
  rentEndDate: '',
  status: 1,
  remark: '',
})

const rules = reactive<FormRules>({
  plateNumber: [{ required: true, message: () => t('vehicle.plateNumberRequired'), trigger: 'blur' }],
  brand: [{ required: true, message: () => t('vehicle.brandRequired'), trigger: 'blur' }],
  model: [{ required: true, message: () => t('vehicle.modelRequired'), trigger: 'blur' }],
  status: [{ required: true, message: () => t('vehicle.statusRequired'), trigger: 'change' }],
})

const statusOptions = computed(() => {
  locale.value
  return [
    { label: t('vehicle.statusMap.1'), value: 1 },
    { label: t('vehicle.statusMap.2'), value: 2 },
    { label: t('vehicle.statusMap.3'), value: 3 },
  ]
})

function resetForm() {
  form.plateNumber = ''
  form.brand = ''
  form.model = ''
  form.color = ''
  form.purchaseDate = ''
  form.rentStartDate = ''
  form.rentEndDate = ''
  form.status = 1
  form.remark = ''
}

async function loadVehicle() {
  if (!props.vehicleId) return
  loading.value = true
  try {
    const data = await vehicleStore.getById(props.vehicleId)
    Object.assign(form, data)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    if (props.vehicleId) {
      await vehicleStore.update(props.vehicleId, { ...form })
    } else {
      await vehicleStore.create({ ...form })
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
      loadVehicle()
    }
  },
)
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    :title="props.vehicleId ? t('vehicle.edit') : t('vehicle.add')"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" v-loading="loading">
      <el-form-item :label="t('vehicle.plateNumber')" prop="plateNumber">
        <el-input v-model="form.plateNumber" />
      </el-form-item>
      <el-form-item :label="t('vehicle.brand')" prop="brand">
        <el-input v-model="form.brand" />
      </el-form-item>
      <el-form-item :label="t('vehicle.model')" prop="model">
        <el-input v-model="form.model" />
      </el-form-item>
      <el-form-item :label="t('vehicle.color')">
        <el-input v-model="form.color" />
      </el-form-item>
      <el-form-item :label="t('vehicle.purchaseDate')">
        <el-date-picker v-model="form.purchaseDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="t('vehicle.rentStartDate')">
        <el-date-picker v-model="form.rentStartDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="t('vehicle.rentEndDate')">
        <el-date-picker v-model="form.rentEndDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="t('vehicle.status')" prop="status">
        <el-select :key="locale" v-model="form.status" style="width: 100%">
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('vehicle.remark')">
        <el-input v-model="form.remark" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>
