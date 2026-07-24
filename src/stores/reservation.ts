import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as reservationApi from '../api/reservation'
import type { Reservation, ReservationQuery, AuditRequest, ReturnRequest, VehicleScheduleItem } from '../types/reservation'

export const useReservationStore = defineStore('reservation', () => {
  const reservationList = ref<Reservation[]>([])
  const total = ref(0)
  const loading = ref(false)

  const query = reactive<ReservationQuery>({
    page: 1,
    size: 10,
    vehicleId: null,
    userId: null,
    status: null,
  })

  async function fetchList() {
    loading.value = true
    try {
      const res = await reservationApi.getReservationList(query)
      reservationList.value = res.data.records
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  async function fetchGanttData(from?: string, to?: string): Promise<VehicleScheduleItem[]> {
    const res = await reservationApi.getSchedule(null, from, to)
    return res.data
  }

  async function getById(id: string) {
    const res = await reservationApi.getReservationById(id)
    return res.data
  }

  async function create(data: Reservation) {
    const res = await reservationApi.createReservation(data)
    return res.data
  }

  async function update(id: string, data: Reservation) {
    const res = await reservationApi.updateReservation(id, data)
    return res.data
  }

  async function cancel(id: string) {
    await reservationApi.cancelReservation(id)
  }

  async function audit(id: string, data: AuditRequest) {
    const res = await reservationApi.auditReservation(id, data)
    return res.data
  }

  async function returnCar(id: string, data: ReturnRequest) {
    const res = await reservationApi.returnVehicle(id, data)
    return res.data
  }

  function resetQuery() {
    query.page = 1
    query.size = 10
    query.vehicleId = null
    query.userId = null
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
    reservationList,
    total,
    loading,
    query,
    fetchList,
    fetchGanttData,
    getById,
    create,
    update,
    cancel,
    audit,
    returnCar,
    resetQuery,
    handlePageChange,
    handleSizeChange,
  }
})
