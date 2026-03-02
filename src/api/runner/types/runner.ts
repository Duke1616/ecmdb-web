/** 执行单元的运行模式 (对应后端 Kind) */
export enum Kind {
  /** 通过 Kafka 推送到工作节点执行 */
  KAFKA = "KAFKA",
  /** 通过分布式任务平台执行节点分发 */
  GRPC = "GRPC"
}

export interface runner {
  id: number
  name: string
  codebook_uid: string
  codebook_name?: string
  codebook_secret: string
  kind: Kind
  target: string
  handler: string
  desc: string
  tags: string[]
  variables: variables[]
}

export interface registerOrUpdateReq {
  id?: number
  name: string
  codebook_uid: string
  codebook_secret: string
  kind: Kind
  target: string
  handler: string
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

export interface listByCodebookIdReq extends listRunnerReq {
  codebook_uid: string
  keyword?: string
  kind?: Kind
}

export interface TagDetail {
  tag: string
  kind: Kind
  target: string
  handler: string
}

export interface runnerTags {
  codebook_name: string
  codebook_uid: string
  tags: TagDetail[]
}

export interface runnerTagResp {
  runner_tags: runnerTags[]
}
