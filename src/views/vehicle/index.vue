<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from '../../stores/vehicle'
import type { Vehicle } from '../../types/vehicle'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import VehicleForm from './components/VehicleForm.vue'

const { t, locale } = useI18n()
const vehicleStore = useVehicleStore()

const formRef = ref<FormInstance>()
const showForm = ref(false)
const editingId = ref<number | null>(null)

const searchForm = reactive({
  plateNumber: '',
  brand: '',
  model: '',
  color: '',
  status: null as number | null,
})

const statusOptions = computed(() => {
  locale.value
  return [
    { label: t('vehicle.statusMap.0'), value: 0 },
    { label: t('vehicle.statusMap.1'), value: 1 },
    { label: t('vehicle.statusMap.2'), value: 2 },
    { label: t('vehicle.statusMap.3'), value: 3 },
  ]
})

function getStatusType(status: number) {
  const map: Record<number, string> = {
    0: 'info',
    1: 'success',
    2: 'warning',
    3: 'danger',
  }
  return map[status] || 'info'
}

function getStatusLabel(status: number) {
  const map: Record<number, string> = {
    0: t('vehicle.statusMap.0'),
    1: t('vehicle.statusMap.1'),
    2: t('vehicle.statusMap.2'),
    3: t('vehicle.statusMap.3'),
  }
  return map[status] || '-'
}

function handleSearch() {
  vehicleStore.query.page = 1
  vehicleStore.query.plateNumber = searchForm.plateNumber
  vehicleStore.query.brand = searchForm.brand
  vehicleStore.query.model = searchForm.model
  vehicleStore.query.color = searchForm.color
  vehicleStore.query.status = searchForm.status
  vehicleStore.fetchList()
}

function handleReset() {
  searchForm.plateNumber = ''
  searchForm.brand = ''
  searchForm.model = ''
  searchForm.color = ''
  searchForm.status = null
  vehicleStore.resetQuery()
  vehicleStore.fetchList()
}

function handleAdd() {
  editingId.value = null
  showForm.value = true
}

function handleEdit(row: Vehicle) {
  editingId.value = row.id ?? null
  showForm.value = true
}

async function handleDelete(row: Vehicle) {
  try {
    await ElMessageBox.confirm(t('vehicle.deleteConfirm'), t('common.confirm'), {
      type: 'warning',
    })
    await vehicleStore.remove(row.id!)
    ElMessage.success(t('common.confirm'))
    vehicleStore.fetchList()
  } catch {
    // cancelled
  }
}

function handleFormClose() {
  showForm.value = false
  editingId.value = null
}

function handleFormSuccess() {
  showForm.value = false
  editingId.value = null
  vehicleStore.fetchList()
}

vehicleStore.fetchList()
</script>

<template>
  <div class="vehicle-page">
    <el-card shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item :label="t('vehicle.plateNumber')">
          <el-input v-model="searchForm.plateNumber" :placeholder="t('vehicle.placeholder.plateNumber')" clearable />
        </el-form-item>
        <el-form-item :label="t('vehicle.brand')">
          <el-input v-model="searchForm.brand" :placeholder="t('vehicle.placeholder.brand')" clearable />
        </el-form-item>
        <el-form-item :label="t('vehicle.model')">
          <el-input v-model="searchForm.model" :placeholder="t('vehicle.placeholder.model')" clearable />
        </el-form-item>
        <el-form-item :label="t('vehicle.color')">
          <el-input v-model="searchForm.color" :placeholder="t('vehicle.placeholder.color')" clearable />
        </el-form-item>
        <el-form-item :label="t('vehicle.status')" style="min-width: 220px">
          <el-select :key="locale" v-model="searchForm.status" :placeholder="t('vehicle.status')" clearable style="width: 200px">
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ t('vehicle.search') }}</el-button>
          <el-button @click="handleReset">{{ t('vehicle.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>{{ t('vehicle.title') }}</span>
          <el-button type="primary" @click="handleAdd">{{ t('vehicle.add') }}</el-button>
        </div>
      </template>

      <el-table :data="vehicleStore.vehicleList" v-loading="vehicleStore.loading" border stripe>
        <el-table-column prop="plateNumber" :label="t('vehicle.plateNumber')"  />
        <el-table-column prop="brand" :label="t('vehicle.brand')"  />
        <el-table-column prop="model" :label="t('vehicle.model')" />
        <el-table-column prop="color" :label="t('vehicle.color')"/>
        <el-table-column prop="purchaseDate" :label="t('vehicle.purchaseDate')"  />
        <el-table-column prop="rentStartDate" :label="t('vehicle.rentStartDate')"  />
        <el-table-column prop="rentEndDate" :label="t('vehicle.rentEndDate')"  />
        <el-table-column :label="t('vehicle.status')" >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="t('vehicle.remark')" width="150" show-overflow-tooltip />
        <el-table-column :label="t('vehicle.operation')" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              {{ t('vehicle.edit') }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              {{ t('vehicle.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="vehicleStore.query.page"
          v-model:page-size="vehicleStore.query.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="vehicleStore.total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="vehicleStore.handlePageChange"
          @size-change="vehicleStore.handleSizeChange"
        />
      </div>
    </el-card>

    <VehicleForm
      v-model:visible="showForm"
      :vehicle-id="editingId"
      @close="handleFormClose"
      @success="handleFormSuccess"
    />
  </div>
</template>

<style scoped>
.vehicle-page {
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
