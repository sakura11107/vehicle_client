<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReservationStore } from '../../stores/reservation'
import { useUserStore } from '../../stores/user'
import type { Reservation } from '../../types/reservation'
import { ElMessage, ElMessageBox } from 'element-plus'
import ReservationDetail from '../dashboard/components/ReservationDetail.vue'

const { t } = useI18n()
const reservationStore = useReservationStore()
const userStore = useUserStore()

const showDetail = ref(false)
const detailId = ref<string | null>(null)

const showAudit = ref(false)
const auditForm = reactive({
  id: null as string | null,
  approved: true,
  remark: '',
})

const showReturn = ref(false)
const returnForm = reactive({
  id: null as string | null,
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

const returnFormRef = ref()

function requiredValidator(_rule: any, value: any, callback: (err?: Error) => void) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return callback(new Error(t('common.required')))
    return callback()
  }
  if (value === null || value === undefined || String(value).trim() === '') {
    return callback(new Error(t('common.required')))
  }
  callback()
}

const returnRules = reactive({
  returnMileage: [{ validator: requiredValidator, trigger: ['blur', 'change'] }],
  returnFuel: [{ validator: requiredValidator, trigger: ['blur', 'change'] }],
  parkingFee: [{ validator: requiredValidator, trigger: ['blur', 'change'] }],
  fuelFee: [{ validator: requiredValidator, trigger: ['blur', 'change'] }],
  otherFee: [{ validator: requiredValidator, trigger: ['blur', 'change'] }],
  returnRemark: [{ validator: requiredValidator, trigger: ['blur', 'change'] }],
})

// 使用 Element Plus 的 `only-number` 限制整数输入，故移除自定义输入过滤器

const statusOptions = computed(() => [
  { label: t('reservation.statusMap.0'), value: 0 },
  { label: t('reservation.statusMap.1'), value: 1 },
  { label: t('reservation.statusMap.2'), value: 2 },
  { label: t('reservation.statusMap.4'), value: 4 },
  { label: t('reservation.statusMap.5'), value: 5 },
])

const fuelOptions = computed(() => {
  const arr: { label: string; value: number }[] = []
  for (let v = 10; v <= 100; v += 10) {
    arr.push({ label: `${v}%`, value: v })
  }
  return arr
})

function getStatusType(status: number | undefined) {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'primary',
    2: 'info',
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

/** 审核：申请中 + 车辆管理员及以上 + 非本人申请（与后端规则一致） */
function canAudit(row: Reservation) {
  return row.status === 0 && userStore.isManagerOrAdmin && row.userId !== userStore.currentUserId
}

/** 还车：已通过 + 申请人本人（与后端规则一致） */
function canReturn(row: Reservation) {
  return row.status === 1 && row.userId === userStore.currentUserId
}

/** 取消：申请中 + 申请人本人（与后端规则一致） */
function canCancel(row: Reservation) {
  return row.status === 0 && row.userId === userStore.currentUserId
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
  auditForm.id = row.id ?? null
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
  returnForm.id = row.id ?? null
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
  try {
    await (returnFormRef.value as any).validate()
  } catch (e) {
    return
  }
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
            <el-button v-if="canAudit(row)" type="success" link size="small" @click="handleAuditOpen(row, true)">
              {{ t('reservation.approve') }}
            </el-button>
            <el-button v-if="canAudit(row)" type="danger" link size="small" @click="handleAuditOpen(row, false)">
              {{ t('reservation.reject') }}
            </el-button>
            <el-button v-if="canReturn(row)" type="warning" link size="small" @click="handleReturnOpen(row)">
              {{ t('reservation.returnCar') }}
            </el-button>
            <el-button v-if="canCancel(row)" type="info" link size="small" @click="handleCancel(row)">
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
      <el-form :model="returnForm" :rules="returnRules" ref="returnFormRef" label-width="auto">
        <el-form-item :label="t('reservation.returnMileage')">
          <el-input v-model.number="returnForm.returnMileage" only-number inputmode="numeric" />
        </el-form-item>
        <el-form-item :label="t('reservation.returnFuel')">
          <el-select v-model="returnForm.returnFuel" placeholder="" clearable>
            <el-option v-for="opt in fuelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('reservation.parkingFee')">
          <el-input v-model.number="returnForm.parkingFee" only-number inputmode="numeric" />
        </el-form-item>
        <el-form-item :label="t('reservation.fuelFee')">
          <el-input v-model.number="returnForm.fuelFee" only-number inputmode="numeric" />
        </el-form-item>
        <el-form-item :label="t('reservation.otherFee')">
          <el-input v-model.number="returnForm.otherFee" only-number inputmode="numeric" />
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
