export interface users {
  total: number
  users: user[]
}

export interface user {
  username: string
  title: string
  email: string
  display_name: string
  is_system_exist: boolean
}
