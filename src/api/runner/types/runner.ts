export interface runner {
  id: number
  name: string
  desc: string
  tags: string[]
}

export interface runners {
  runners: runner[]
  total: number
}

export interface listRunnerReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}
