export interface runner {
  id: number
  name: string
  worker_name: string
  topic: string
  codebook_uid: string
  codebook_secret: string
  desc: string
  tags: string[]
  variables: variables[]
}

export interface registerOrUpdateReq {
  id?: number
  name: string
  worker_name: string
  topic: string
  codebook_uid: string
  codebook_secret: string
  desc: string
  tags: string[]
  variables?: variables[]
}

export interface runners {
  runners: runner[]
  total: number
}

export interface variables {
  key: string
  value: any
  secret: boolean
}

export interface listRunnerReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface runnerTags {
  codebook_name: string
  codebook_uid: string
  tags: string[]
}

export interface runnerTagResp {
  runner_tags: runnerTags[]
}
