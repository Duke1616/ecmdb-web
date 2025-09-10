export interface department {
  id: number
  pid: number
  name: string
  sort: number
  enabled: boolean
  leaders: string[]
  main_leader: string
  children: department[]
}

export interface createOrUpdateDepartment {
  id?: number
  pid?: number
  name: string
  sort: number
  enabled: boolean
  leaders?: string[]
  main_leader?: string
}
