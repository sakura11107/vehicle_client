export interface Reservation {
  id?: number
  vehicleId: number
  userId?: number
  startTime: string
  endTime: string
  purpose: string
  status?: number
  auditUserId?: number
  auditTime?: string
  auditRemark?: string
  pickupTime?: string
  pickupMileage?: number
  pickupFuel?: number
  returnTime?: string
  returnMileage?: number
  returnFuel?: number
  returnRemark?: string
  parkingFee?: number
  fuelFee?: number
  otherFee?: number
  createdTime?: string
  updatedTime?: string
  vehiclePlateNumber?: string
  vehicleBrand?: string
  vehicleModel?: string
  userName?: string
  auditUserName?: string
}

export interface ReservationQuery {
  page: number
  size: number
  vehicleId?: number | null
  userId?: number | null
  status?: number | null
}

export interface AuditRequest {
  approved: boolean
  remark?: string
}

export interface ReturnRequest {
  returnMileage: number
  returnFuel: number
  parkingFee?: number
  fuelFee?: number
  otherFee?: number
  returnRemark?: string
}
