<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from '../../stores/vehicle'
import { useUserStore } from '../../stores/user'
import type { Vehicle } from '../../types/vehicle'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import VehicleForm from './components/VehicleForm.vue'
import * as vehicleApi from '../../api/vehicle'

const { t, locale } = useI18n()
const vehicleStore = useVehicleStore()
const userStore = useUserStore()

const showForm = ref(false)
const editingId = ref<string | null>(null)
const showImport = ref(false)
const importing = ref(false)
const importFile = ref<File | null>(null)

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
    { label: t('vehicle.statusMap.1'), value: 1 },
    { label: t('vehicle.statusMap.2'), value: 2 },
    { label: t('vehicle.statusMap.3'), value: 3 },
  ]
})

function getStatusType(status: number) {
  const map: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'danger',
  }
  return map[status] || 'info'
}

function getStatusLabel(status: number) {
  const map: Record<number, string> = {
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

function handleImport() {
  importFile.value = null
  showImport.value = true
}

function handleImportClose() {
  showImport.value = false
  importFile.value = null
}

function handleFileChange(file: any) {
  importFile.value = file.raw
}

async function handleDownloadTemplate() {
  try {
    const blob = await vehicleApi.downloadImportTemplate()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '车辆导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    ElMessage.error(t('vehicle.importFail'))
  }
}

async function handleImportSubmit() {
  if (!importFile.value) {
    ElMessage.warning(t('vehicle.fileRequired'))
    return
  }

  importing.value = true
  try {
    const res = await vehicleApi.importVehicles(importFile.value)
    ElMessage.success(t('vehicle.importSuccess', { count: res.data }))
    showImport.value = false
    importFile.value = null
    vehicleStore.fetchList()
  } catch {
    ElMessage.error(t('vehicle.importFail'))
  } finally {
    importing.value = false
  }
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
          <div>
            <el-button v-if="userStore.isManagerOrAdmin" type="success" @click="handleImport">
              <el-icon class="el-icon--left"><Upload /></el-icon>
              {{ t('vehicle.import') }}
            </el-button>
            <el-button v-if="userStore.isManagerOrAdmin" type="primary" @click="handleAdd">{{ t('vehicle.add') }}</el-button>
          </div>
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
            <el-button v-if="userStore.isManagerOrAdmin" type="primary" link size="small" @click="handleEdit(row)">
              {{ t('vehicle.edit') }}
            </el-button>
            <el-button v-if="userStore.isManagerOrAdmin" type="danger" link size="small" @click="handleDelete(row)">
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

    <el-dialog
      v-model="showImport"
      :title="t('vehicle.import')"
      width="500px"
      @close="handleImportClose"
    >
      <div style="margin-bottom: 16px;">
        <el-alert type="info" :closable="false">
          <template #title>
            <span>{{ t('vehicle.templateHint') }}</span>
          </template>
        </el-alert>
      </div>

      <div style="margin-bottom: 16px;">
        <el-button type="primary" link @click="handleDownloadTemplate">
          <el-icon class="el-icon--left"><Download /></el-icon>
          {{ t('vehicle.importTemplate') }}
        </el-button>
      </div>

      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
        :on-exceed="() => ElMessage.warning(t('vehicle.fileRequired'))"
        drag
      >
        <el-icon style="font-size: 48px; color: #909399;"><Upload /></el-icon>
        <div style="margin-top: 8px; color: #606266;">{{ t('vehicle.dragOrClick') }}</div>
      </el-upload>

      <template #footer>
        <el-button @click="handleImportClose">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="importing" @click="handleImportSubmit">
          {{ importing ? t('vehicle.uploading') : t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
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
.card-header > div {
  display: flex;
  gap: 8px;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
