import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import request from '../utils/request'
import type { Vehicle, VehicleQuery, PageResult } from '../types/vehicle'
import type { ApiResponse } from '../types/user'

export const useVehicleStore = defineStore('vehicle', () => {
  const vehicleList = ref<Vehicle[]>([])
  const total = ref(0)
  const loading = ref(false)

  const query = reactive<VehicleQuery>({
    page: 1,
    size: 10,
    plateNumber: '',
    brand: '',
    model: '',
    color: '',
    status: null,
  })

  async function fetchList() {
    loading.value = true
    try {
      const params: Record<string, string | number> = {
        page: query.page,
        size: query.size,
      }
      if (query.plateNumber) params.plateNumber = query.plateNumber
      if (query.brand) params.brand = query.brand
      if (query.model) params.model = query.model
      if (query.color) params.color = query.color
      if (query.status !== null && query.status !== undefined) params.status = query.status

      const res: ApiResponse<PageResult<Vehicle>> = await request.get('/vehicles', { params })
      vehicleList.value = res.data.records
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  async function getById(id: number) {
    const res: ApiResponse<Vehicle> = await request.get(`/vehicles/${id}`)
    return res.data
  }

  async function create(data: Vehicle) {
    const res: ApiResponse<Vehicle> = await request.post('/vehicles', data)
    return res.data
  }

  async function update(id: number, data: Vehicle) {
    const res: ApiResponse<Vehicle> = await request.put(`/vehicles/${id}`, data)
    return res.data
  }

  async function remove(id: number) {
    await request.delete(`/vehicles/${id}`)
  }

  function resetQuery() {
    query.page = 1
    query.size = 10
    query.plateNumber = ''
    query.brand = ''
    query.model = ''
    query.color = ''
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
    vehicleList,
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
