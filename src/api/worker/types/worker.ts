export interface worker {
  id: number
  name: string
  desc: string
  topic: string
  status: number
}

export interface listWorkerReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface workers {
  workers: worker[]
  total: number
}
