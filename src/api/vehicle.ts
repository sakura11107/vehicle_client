import request from '../utils/request'
import type { Vehicle, VehicleQuery, PageResult } from '../types/vehicle'
import type { ApiResponse } from '../types/user'

export function getVehicleList(params: VehicleQuery) {
  const query: Record<string, string | number> = {
    page: params.page,
    size: params.size,
  }
  if (params.plateNumber) query.plateNumber = params.plateNumber
  if (params.brand) query.brand = params.brand
  if (params.model) query.model = params.model
  if (params.color) query.color = params.color
  if (params.status !== null && params.status !== undefined) query.status = params.status

  return request.get('/vehicles', { params: query }) as Promise<ApiResponse<PageResult<Vehicle>>>
}

export function getVehicleById(id: string) {
  return request.get(`/vehicles/${id}`) as Promise<ApiResponse<Vehicle>>
}

export function createVehicle(data: Vehicle) {
  return request.post('/vehicles', data) as Promise<ApiResponse<Vehicle>>
}

export function updateVehicle(id: string, data: Vehicle) {
  return request.put(`/vehicles/${id}`, data) as Promise<ApiResponse<Vehicle>>
}

export function deleteVehicle(id: string) {
  return request.delete(`/vehicles/${id}`) as Promise<ApiResponse<void>>
}
