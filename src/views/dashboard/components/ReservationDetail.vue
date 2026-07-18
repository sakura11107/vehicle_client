<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReservationStore } from '../../../stores/reservation'
import type { Reservation } from '../../../types/reservation'

const props = defineProps<{
  visible: boolean
  reservationId: number | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const { t } = useI18n()
const reservationStore = useReservationStore()
const loading = ref(false)
const detail = ref<Reservation | null>(null)

function getStatusLabel(status: number | undefined) {
  const map: Record<number, string> = {
    0: t('reservation.statusMap.0'),
    1: t('reservation.statusMap.1'),
    2: t('reservation.statusMap.2'),
    3: t('reservation.statusMap.3'),
    4: t('reservation.statusMap.4'),
    5: t('reservation.statusMap.5'),
  }
  return map[status ?? -1] ?? '-'
}

function getStatusType(status: number | undefined) {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'primary',
    2: 'info',
    3: 'success',
    4: '',
    5: 'danger',
  }
  return map[status ?? -1] ?? 'info'
}

async function loadDetail() {
  if (!props.reservationId) return
  loading.value = true
  try {
    detail.value = await reservationStore.getById(props.reservationId)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (val) => {
    if (val) loadDetail()
    else detail.value = null
  },
)
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    :title="t('reservation.detail')"
    width="600px"
    @close="handleClose"
  >
    <el-descriptions :column="2" border v-loading="loading" v-if="detail">
      <el-descriptions-item :label="t('reservation.id')">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.status')">
        <el-tag :type="getStatusType(detail.status)">{{ getStatusLabel(detail.status) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="t('reservation.vehicle')">{{ detail.vehiclePlateNumber || detail.vehicleId }}</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.applicant')">{{ detail.userName || detail.userId }}</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.startTime')">{{ detail.startTime }}</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.endTime')">{{ detail.endTime }}</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.purpose')" :span="2">{{ detail.purpose }}</el-descriptions-item>

      <el-descriptions-item :label="t('reservation.auditUser')" v-if="detail.auditUserId">{{ detail.auditUserId }}</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.auditTime')" v-if="detail.auditTime">{{ detail.auditTime }}</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.auditRemark')" :span="2" v-if="detail.auditRemark">{{ detail.auditRemark }}</el-descriptions-item>

      <el-descriptions-item :label="t('reservation.pickupTime')" v-if="detail.pickupTime">{{ detail.pickupTime }}</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.pickupMileage')" v-if="detail.pickupMileage">{{ detail.pickupMileage }} km</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.pickupFuel')" v-if="detail.pickupFuel">{{ detail.pickupFuel }}%</el-descriptions-item>

      <el-descriptions-item :label="t('reservation.returnTime')" v-if="detail.returnTime">{{ detail.returnTime }}</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.returnMileage')" v-if="detail.returnMileage">{{ detail.returnMileage }} km</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.returnFuel')" v-if="detail.returnFuel">{{ detail.returnFuel }}%</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.returnRemark')" :span="2" v-if="detail.returnRemark">{{ detail.returnRemark }}</el-descriptions-item>

      <el-descriptions-item :label="t('reservation.parkingFee')" v-if="detail.parkingFee">{{ detail.parkingFee }} 元</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.fuelFee')" v-if="detail.fuelFee">{{ detail.fuelFee }} 元</el-descriptions-item>
      <el-descriptions-item :label="t('reservation.otherFee')" v-if="detail.otherFee">{{ detail.otherFee }} 元</el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
    </template>
  </el-dialog>
</template>
