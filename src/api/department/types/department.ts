export interface department {
  id: number
  pid: number
  name: string
  sort: number
  enabled: boolean
  leaders: number[]
  main_leader: number
  children: department[]
}

export interface createOrUpdateDepartment {
  id?: number
  pid?: number
  name: string
  sort: number
  enabled: boolean
  leaders?: number[]
  main_leader?: number
}
