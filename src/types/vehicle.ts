export interface Vehicle {
  id?: number
  plateNumber: string
  brand: string
  model: string
  color: string
  purchaseDate: string
  rentStartDate: string
  rentEndDate: string
  status: number
  remark: string
  createdTime?: string
  updatedTime?: string
}

export interface VehicleQuery {
  page: number
  size: number
  plateNumber?: string
  brand?: string
  model?: string
  color?: string
  status?: number | null
}

export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
  totalPages: number
}
