export interface UserInfo {
  id: number
  username: string
  email: string
  role: number
  status: number
  lastLoginTime: string
  createdTime: string
  updatedTime: string
}

export interface FieldError {
  field: string
  code: string
}

export interface ApiResponse<T> {
  code: string
  data: T
  errors: FieldError[] | null
}
