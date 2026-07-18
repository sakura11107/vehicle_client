import request from '../utils/request'
import type { Reservation, ReservationQuery, AuditRequest, ReturnRequest, VehicleScheduleItem } from '../types/reservation'
import type { PageResult } from '../types/vehicle'
import type { ApiResponse } from '../types/user'

export function getReservationList(params: ReservationQuery) {
  const query: Record<string, string | number> = {
    page: params.page,
    size: params.size,
  }
  if (params.vehicleId) query.vehicleId = params.vehicleId
  if (params.userId) query.userId = params.userId
  if (params.status !== null && params.status !== undefined) query.status = params.status

  return request.get('/reservations', { params: query }) as Promise<ApiResponse<PageResult<Reservation>>>
}

export function getReservationById(id: number) {
  return request.get(`/reservations/${id}`) as Promise<ApiResponse<Reservation>>
}

export function createReservation(data: Reservation) {
  return request.post('/reservations', data) as Promise<ApiResponse<Reservation>>
}

export function updateReservation(id: number, data: Reservation) {
  return request.put(`/reservations/${id}`, data) as Promise<ApiResponse<Reservation>>
}

export function cancelReservation(id: number) {
  return request.put(`/reservations/${id}/cancel`) as Promise<ApiResponse<void>>
}

export function auditReservation(id: number, data: AuditRequest) {
  return request.put(`/reservations/${id}/audit`, data) as Promise<ApiResponse<Reservation>>
}

export function returnVehicle(id: number, data: ReturnRequest) {
  return request.put(`/reservations/${id}/return`, data) as Promise<ApiResponse<Reservation>>
}

export function getSchedule(vehicleId?: number | null) {
  const params: Record<string, string | number> = {}
  if (vehicleId) params.vehicleId = vehicleId
  return request.get('/reservations/schedule', { params }) as Promise<ApiResponse<VehicleScheduleItem[]>>
}
