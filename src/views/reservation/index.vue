<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReservationStore } from '../../stores/reservation'
import type { Reservation } from '../../types/reservation'
import { ElMessage, ElMessageBox } from 'element-plus'
import ReservationDetail from '../dashboard/components/ReservationDetail.vue'

const { t } = useI18n()
const reservationStore = useReservationStore()

const showDetail = ref(false)
const detailId = ref<number | null>(null)

const showAudit = ref(false)
const auditForm = reactive({
  id: null as number | null,
  approved: true,
  remark: '',
})

const showReturn = ref(false)
const returnForm = reactive({
  id: null as number | null,
  returnMileage: 0,
  returnFuel: 0,
  parkingFee: 0,
  fuelFee: 0,
  otherFee: 0,
  returnRemark: '',
})

const searchForm = reactive({
  status: null as number | null,
})

const statusOptions = computed(() => [
  { label: t('reservation.statusMap.0'), value: 0 },
  { label: t('reservation.statusMap.1'), value: 1 },
  { label: t('reservation.statusMap.2'), value: 2 },
  { label: t('reservation.statusMap.3'), value: 3 },
  { label: t('reservation.statusMap.4'), value: 4 },
  { label: t('reservation.statusMap.5'), value: 5 },
])

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

function handleSearch() {
  reservationStore.query.page = 1
  reservationStore.query.status = searchForm.status
  reservationStore.fetchList()
}

function handleReset() {
  searchForm.status = null
  reservationStore.resetQuery()
  reservationStore.fetchList()
}

function handleDetail(row: Reservation) {
  detailId.value = row.id ?? null
  showDetail.value = true
}

function handleCancel(row: Reservation) {
  ElMessageBox.confirm(t('reservation.cancelConfirm'), t('common.confirm'), { type: 'warning' })
    .then(async () => {
      await reservationStore.cancel(row.id!)
      ElMessage.success(t('common.confirm'))
      reservationStore.fetchList()
    })
    .catch(() => {})
}

function handleAuditOpen(row: Reservation, approved: boolean) {
  auditForm.id = row.id
  auditForm.approved = approved
  auditForm.remark = ''
  showAudit.value = true
}

async function handleAuditSubmit() {
  if (!auditForm.id) return
  await reservationStore.audit(auditForm.id, {
    approved: auditForm.approved,
    remark: auditForm.remark,
  })
  ElMessage.success(t('common.confirm'))
  showAudit.value = false
  reservationStore.fetchList()
}

function handleReturnOpen(row: Reservation) {
  returnForm.id = row.id
  returnForm.returnMileage = 0
  returnForm.returnFuel = 0
  returnForm.parkingFee = 0
  returnForm.fuelFee = 0
  returnForm.otherFee = 0
  returnForm.returnRemark = ''
  showReturn.value = true
}

async function handleReturnSubmit() {
  if (!returnForm.id) return
  await reservationStore.returnCar(returnForm.id, {
    returnMileage: returnForm.returnMileage,
    returnFuel: returnForm.returnFuel,
    parkingFee: returnForm.parkingFee,
    fuelFee: returnForm.fuelFee,
    otherFee: returnForm.otherFee,
    returnRemark: returnForm.returnRemark,
  })
  ElMessage.success(t('common.confirm'))
  showReturn.value = false
  reservationStore.fetchList()
}

reservationStore.fetchList()
</script>

<template>
  <div class="reservation-page">
    <el-card shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item :label="t('reservation.status')" style="min-width: 200px">
          <el-select v-model="searchForm.status" :placeholder="t('reservation.status')" clearable>
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ t('reservation.search') }}</el-button>
          <el-button @click="handleReset">{{ t('reservation.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>{{ t('reservation.title') }}</span>
        </div>
      </template>

      <el-table :data="reservationStore.reservationList" v-loading="reservationStore.loading" border stripe>
        <el-table-column prop="vehiclePlateNumber" :label="t('reservation.plateNumber')" width="120" />
        <el-table-column prop="vehicleBrand" :label="t('reservation.brand')" width="100" />
        <el-table-column prop="vehicleModel" :label="t('reservation.model')" width="100" />
        <el-table-column prop="userName" :label="t('reservation.applicant')" width="100" />
        <el-table-column prop="startTime" :label="t('reservation.startTime')" width="170" />
        <el-table-column prop="endTime" :label="t('reservation.endTime')" width="170" />
        <el-table-column prop="purpose" :label="t('reservation.purpose')" min-width="120" show-overflow-tooltip />
        <el-table-column :label="t('reservation.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditUserName" :label="t('reservation.auditUser')" width="100" />
        <el-table-column :label="t('reservation.operation')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              {{ t('reservation.detail') }}
            </el-button>
            <el-button v-if="row.status === 0" type="success" link size="small" @click="handleAuditOpen(row, true)">
              {{ t('reservation.approve') }}
            </el-button>
            <el-button v-if="row.status === 0" type="danger" link size="small" @click="handleAuditOpen(row, false)">
              {{ t('reservation.reject') }}
            </el-button>
            <el-button v-if="row.status === 1 || row.status === 3" type="warning" link size="small" @click="handleReturnOpen(row)">
              {{ t('reservation.returnCar') }}
            </el-button>
            <el-button v-if="row.status === 0" type="info" link size="small" @click="handleCancel(row)">
              {{ t('reservation.cancel') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="reservationStore.query.page"
          v-model:page-size="reservationStore.query.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="reservationStore.total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="reservationStore.handlePageChange"
          @size-change="reservationStore.handleSizeChange"
        />
      </div>
    </el-card>

    <ReservationDetail v-model:visible="showDetail" :reservation-id="detailId" />

    <el-dialog v-model="showAudit" :title="t('reservation.audit')" width="400px">
      <el-form label-width="auto">
        <el-form-item :label="t('reservation.auditResult')">
          <el-tag :type="auditForm.approved ? 'success' : 'danger'">
            {{ auditForm.approved ? t('reservation.approve') : t('reservation.reject') }}
          </el-tag>
        </el-form-item>
        <el-form-item :label="t('reservation.auditRemark')">
          <el-input v-model="auditForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAudit = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleAuditSubmit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReturn" :title="t('reservation.returnCar')" width="500px">
      <el-form :model="returnForm" label-width="auto">
        <el-form-item :label="t('reservation.returnMileage')">
          <el-input-number v-model="returnForm.returnMileage" :min="0" />
        </el-form-item>
        <el-form-item :label="t('reservation.returnFuel')">
          <el-input-number v-model="returnForm.returnFuel" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item :label="t('reservation.parkingFee')">
          <el-input-number v-model="returnForm.parkingFee" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item :label="t('reservation.fuelFee')">
          <el-input-number v-model="returnForm.fuelFee" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item :label="t('reservation.otherFee')">
          <el-input-number v-model="returnForm.otherFee" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item :label="t('reservation.returnRemark')">
          <el-input v-model="returnForm.returnRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReturn = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleReturnSubmit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.reservation-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
