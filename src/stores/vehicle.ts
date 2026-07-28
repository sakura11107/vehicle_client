import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as vehicleApi from '../api/vehicle'
import type { Vehicle, VehicleQuery } from '../types/vehicle'

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

  async function fetchList(params?: { page?: number; size?: number }) {
    if (params) {
      if (params.page !== undefined) query.page = params.page
      if (params.size !== undefined) query.size = params.size
    }
    loading.value = true
    try {
      const res = await vehicleApi.getVehicleList(query)
      const payload = res.data ?? {}
      vehicleList.value = Array.isArray(payload.records) ? payload.records : []
      total.value = Number(payload.total ?? 0)
      query.page = Number(payload.page ?? query.page ?? 1)
      query.size = Number(payload.size ?? query.size ?? 10)
    } finally {
      loading.value = false
    }
  }

  async function getById(id: string) {
    const res = await vehicleApi.getVehicleById(id)
    return res.data
  }

  async function create(data: Vehicle) {
    const res = await vehicleApi.createVehicle(data)
    return res.data
  }

  async function update(id: string, data: Vehicle) {
    const res = await vehicleApi.updateVehicle(id, data)
    return res.data
  }

  async function remove(id: string) {
    await vehicleApi.deleteVehicle(id)
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
    query.page = Number(page) || 1
    fetchList()
  }

  function handleSizeChange(size: number) {
    query.size = Number(size) || 10
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
