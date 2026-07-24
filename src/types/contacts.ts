export interface ContactGroup {
  groupName: string
  role: number
  userCount: number
  onlineCount: number
}

export interface ContactUser {
  id: string
  username: string
  role: number
  roleName: string
  online: boolean
}
