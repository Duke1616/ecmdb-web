export interface createCodebookReq {
  name: string
  language: string
  code: string
}

export interface codebook {
  id: number
  name: string
  language: string
  code: string
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
