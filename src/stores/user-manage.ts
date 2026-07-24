import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as userApi from '../api/user-manage'
import type { User, UserQuery } from '../types/user-manage'

export const useUserManageStore = defineStore('userManage', () => {
  const userList = ref<User[]>([])
  const total = ref(0)
  const loading = ref(false)

  const query = reactive<UserQuery>({
    page: 1,
    size: 10,
    username: '',
    status: null,
  })

  async function fetchList() {
    loading.value = true
    try {
      const res = await userApi.getUserList(query)
      userList.value = res.data.records
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  async function getById(id: string) {
    const res = await userApi.getUserById(id)
    return res.data
  }

  async function create(data: User) {
    const res = await userApi.createUser(data)
    return res.data
  }

  async function update(id: string, data: User) {
    const res = await userApi.updateUser(id, data)
    return res.data
  }

  async function remove(id: string) {
    await userApi.deleteUser(id)
  }

  function resetQuery() {
    query.page = 1
    query.size = 10
    query.username = ''
    query.status = null
  }

  function handlePageChange(page: number) {
    query.page = page
    fetchList()
  }

  function handleSizeChange(size: number) {
    query.size = size
    query.page = 1
    fetchList()
  }

  return {
    userList,
    total,
    loading,
    query,
    fetchList,
    getById,
    create,
    update,
    remove,
    resetQuery,
    handlePageChange,
    handleSizeChange,
  }
})
