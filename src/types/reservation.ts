export interface Reservation {
  id?: string
  vehicleId: string
  userId?: string
  startTime: string
  endTime: string
  purpose: string
  status?: number
  auditUserId?: string
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

export interface VehicleScheduleItem {
  id: string
  vehicleId: string
  vehiclePlateNumber: string
  userName: string
  purpose: string
  startTime: string
  endTime: string
  status: number
}

export interface ReservationQuery {
  page: number
  size: number
  vehicleId?: string | null
  userId?: string | null
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
