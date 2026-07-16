export interface User {
  id?: number
  username: string
  email: string
  password?: string
  role: number
  status: number
  lastLoginTime?: string
  createdTime?: string
  updatedTime?: string
}

export interface UserQuery {
  page: number
  size: number
  username?: string
  status?: number | null
}
