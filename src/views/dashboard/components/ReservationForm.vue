<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from '../../../stores/vehicle'
import { useReservationStore } from '../../../stores/reservation'
import type { Vehicle } from '../../../types/vehicle'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const { t } = useI18n()
const vehicleStore = useVehicleStore()
const reservationStore = useReservationStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const vehicleList = ref<Vehicle[]>([])

const form = reactive({
  vehicleId: null as number | null,
  startTime: '',
  endTime: '',
  purpose: '',
})

const rules = reactive<FormRules>({
  vehicleId: [{ required: true, message: () => t('reservation.vehicleRequired'), trigger: 'change' }],
  startTime: [{ required: true, message: () => t('reservation.startTimeRequired'), trigger: 'change' }],
  endTime: [{ required: true, message: () => t('reservation.endTimeRequired'), trigger: 'change' }],
  purpose: [{ required: true, message: () => t('reservation.purposeRequired'), trigger: 'blur' }],
})

async function loadVehicles() {
  const res = await vehicleStore.fetchList()
  vehicleList.value = vehicleStore.vehicleList
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await reservationStore.create({
      vehicleId: form.vehicleId!,
      startTime: form.startTime,
      endTime: form.endTime,
      purpose: form.purpose,
    })
    ElMessage.success(t('reservation.createSuccess'))
    emit('success')
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}

function resetForm() {
  form.vehicleId = null
  form.startTime = ''
  form.endTime = ''
  form.purpose = ''
}

import { watch } from 'vue'

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
      loadVehicles()
    }
  },
)
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    :title="t('reservation.add')"
    width="500px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" v-loading="loading">
      <el-form-item :label="t('reservation.vehicle')" prop="vehicleId">
        <el-select v-model="form.vehicleId" filterable :placeholder="t('reservation.placeholder.vehicle')" style="width: 100%">
          <el-option
            v-for="v in vehicleList"
            :key="v.id"
            :label="v.plateNumber"
            :value="v.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('reservation.startTime')" prop="startTime">
        <el-date-picker
          v-model="form.startTime"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss"
          :placeholder="t('reservation.placeholder.startTime')"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item :label="t('reservation.endTime')" prop="endTime">
        <el-date-picker
          v-model="form.endTime"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss"
          :placeholder="t('reservation.placeholder.endTime')"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item :label="t('reservation.purpose')" prop="purpose">
        <el-input v-model="form.purpose" type="textarea" :rows="3" :placeholder="t('reservation.placeholder.purpose')" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>
