export interface createOrUpdateCodebookReq {
  id?: number
  name: string
  owner: string
  language: string
  code: string
  identifier: string
}

export interface codebook {
  id: number
  name: string
  owner: string
  language: string
  code: string
  secret: string
  identifier: string
}

export interface codebooks {
  codebooks: codebook[]
  total: number
}

export interface listCodebookReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}
