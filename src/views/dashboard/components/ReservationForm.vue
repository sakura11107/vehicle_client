<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVehicleList } from '../../../api/vehicle'
import { getSchedule } from '../../../api/reservation'
import { useReservationStore } from '../../../stores/reservation'
import type { Vehicle } from '../../../types/vehicle'
import type { VehicleScheduleItem } from '../../../types/reservation'
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
const reservationStore = useReservationStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const vehicleList = ref<Vehicle[]>([])
const vehicleSchedule = ref<VehicleScheduleItem[]>([])
const conflictItems = ref<VehicleScheduleItem[]>([])

const form = reactive({
  vehicleId: null as string | null,
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
  const res = await getVehicleList({ page: 1, size: 100, plateNumber: '', brand: '', model: '', color: '', status: null })
  vehicleList.value = res.data.records
}

async function loadVehicleSchedule(vehicleId: string) {
  const res = await getSchedule(vehicleId)
  vehicleSchedule.value = res.data
  checkConflict()
}

function checkConflict() {
  if (!form.vehicleId || !form.startTime || !form.endTime) {
    conflictItems.value = []
    return
  }
  const start = new Date(form.startTime).getTime()
  const end = new Date(form.endTime).getTime()
  if (start >= end) {
    conflictItems.value = []
    return
  }
  conflictItems.value = vehicleSchedule.value.filter((item) => {
    const itemStart = new Date(item.startTime).getTime()
    const itemEnd = new Date(item.endTime).getTime()
    return itemStart < end && itemEnd > start
  })
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
  vehicleSchedule.value = []
  conflictItems.value = []
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
      loadVehicles()
    }
  },
)

watch(
  () => form.vehicleId,
  (val) => {
    if (val) {
      loadVehicleSchedule(val)
    } else {
      vehicleSchedule.value = []
      conflictItems.value = []
    }
  },
)

watch(
  () => [form.startTime, form.endTime],
  () => {
    checkConflict()
  },
)
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    :title="t('reservation.add')"
    width="640px"
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

    <div v-if="vehicleSchedule.length > 0" class="schedule-section">
      <div class="schedule-title">{{ t('reservation.vehicleReservations') }}</div>
      <div class="schedule-list">
        <div v-for="item in vehicleSchedule" :key="item.id" class="schedule-item">
          <span class="schedule-user">{{ item.userName }}</span>
          <span class="schedule-purpose">{{ item.purpose }}</span>
          <span class="schedule-time">{{ item.startTime }} ~ {{ item.endTime }}</span>
          <el-tag size="small" :type="item.status === 0 ? 'warning' : ''">
            {{ t(`reservation.statusMap.${item.status}`) }}
          </el-tag>
        </div>
      </div>
    </div>

    <el-alert
      v-if="conflictItems.length > 0"
      :title="t('reservation.timeConflict')"
      type="warning"
      :closable="false"
      show-icon
      class="conflict-alert"
    >
      <div v-for="item in conflictItems" :key="item.id" class="conflict-item">
        {{ item.userName }} - {{ item.purpose }} ({{ item.startTime }} ~ {{ item.endTime }})
      </div>
    </el-alert>

    <template #footer>
      <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.schedule-section {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}
.schedule-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.schedule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  padding: 4px 0;
}
.schedule-user {
  font-weight: 500;
  color: #374151;
  min-width: 60px;
}
.schedule-purpose {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.schedule-time {
  color: #9ca3af;
  white-space: nowrap;
}
.conflict-alert {
  margin-top: 12px;
}
.conflict-item {
  font-size: 12px;
  color: #92400e;
  line-height: 1.8;
}
</style>
