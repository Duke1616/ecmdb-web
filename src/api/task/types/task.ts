export interface startTaskReq {
  process_id: number
  business_id: string
  comment: string
  variables: variables[]
}

export interface variables {
  key: string
  value: string
}

export interface page {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface task {
  id: number
  order_id: number
  codebook_uid: string
  status: number
  result: string
  code: string
  args: string
  variables: string
  language: string
}

export interface tasks {
  tasks: task[]
  total: number
}

export interface args {
  id: number
  args: any
}

export interface varibales {
  id: number
  variables: string
}
