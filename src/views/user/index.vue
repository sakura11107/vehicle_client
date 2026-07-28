<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserManageStore } from '../../stores/user-manage'
import type { User } from '../../types/user-manage'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserForm from './components/UserForm.vue'

const { t, locale } = useI18n()
const userManageStore = useUserManageStore()

const showForm = ref(false)
const editingId = ref<string | null>(null)

const searchForm = reactive({
  username: '',
  status: null as number | null,
})

const statusOptions = computed(() => {
  locale.value
  return [
    { label: t('userManage.statusMap.0'), value: 0 },
    { label: t('userManage.statusMap.1'), value: 1 },
  ]
})

function getStatusType(status: number) {
  return status === 1 ? 'success' : 'danger'
}

function getStatusLabel(status: number) {
  const map: Record<number, string> = {
    0: t('userManage.statusMap.0'),
    1: t('userManage.statusMap.1'),
  }
  return map[status] || '-'
}

function getRoleLabel(role: number) {
  const map: Record<number, string> = {
    0: t('userManage.roleMap.0'),
    1: t('userManage.roleMap.1'),
    2: t('userManage.roleMap.2'),
  }
  return map[role] || '-'
}

function handleSearch() {
  userManageStore.query.page = 1
  userManageStore.query.username = searchForm.username
  userManageStore.query.status = searchForm.status
  userManageStore.fetchList()
}

function handleReset() {
  searchForm.username = ''
  searchForm.status = null
  userManageStore.resetQuery()
  userManageStore.fetchList()
}

function handleAdd() {
  editingId.value = null
  showForm.value = true
}

function handleEdit(row: User) {
  editingId.value = row.id ?? null
  showForm.value = true
}

async function handleDelete(row: User) {
  try {
    await ElMessageBox.confirm(t('userManage.deleteConfirm'), t('common.confirm'), {
      type: 'warning',
    })
    await userManageStore.remove(row.id!)
    ElMessage.success(t('common.confirm'))
    userManageStore.fetchList()
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
  userManageStore.fetchList()
}

userManageStore.fetchList()
</script>

<template>
  <div class="user-page">
    <el-card shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item :label="t('userManage.username')">
          <el-input v-model="searchForm.username" :placeholder="t('userManage.placeholder.username')" clearable />
        </el-form-item>
        <el-form-item :label="t('userManage.status')" style="min-width: 220px">
          <el-select :key="locale" v-model="searchForm.status" :placeholder="t('userManage.status')" clearable style="width: 200px">
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ t('userManage.search') }}</el-button>
          <el-button @click="handleReset">{{ t('userManage.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>{{ t('userManage.title') }}</span>
          <el-button type="primary" @click="handleAdd">{{ t('userManage.add') }}</el-button>
        </div>
      </template>

      <el-table :data="userManageStore.userList" v-loading="userManageStore.loading" border stripe>
        <el-table-column prop="username" :label="t('userManage.username')"  />
        <el-table-column prop="email" :label="t('userManage.email')"  />
        <el-table-column :label="t('userManage.role')" >
          <template #default="{ row }">
            {{ getRoleLabel(row.role) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('userManage.status')">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" :label="t('userManage.lastLoginTime')"  />
        <el-table-column prop="createdTime" :label="t('userManage.createdTime')"  />
        <el-table-column :label="t('userManage.operation')" >
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              {{ t('userManage.edit') }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              {{ t('userManage.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :current-page="userManageStore.query.page"
          :page-size="userManageStore.query.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="Number(userManageStore.total || 0)"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="userManageStore.handlePageChange"
          @size-change="userManageStore.handleSizeChange"
        />
      </div>
    </el-card>

    <UserForm
      v-model:visible="showForm"
      :user-id="editingId"
      @close="handleFormClose"
      @success="handleFormSuccess"
    />
  </div>
</template>

<style scoped>
.user-page {
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
