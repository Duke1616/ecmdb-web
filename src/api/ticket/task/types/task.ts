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

export interface listByInstanceId {
  instance_id: number
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

/** 任务运行模式 (对应后端 Kind) */
export enum Kind {
  /** 通过 Kafka 推送到工作节点执行 */
  KAFKA = "KAFKA",
  /** 通过分布式任务平台执行节点分发 */
  GRPC = "GRPC"
}

export interface task {
  id: number
  order_id: number
  kind: Kind
  codebook_uid: string
  codebook_name: string
  target: string
  handler: string
  status: number
  is_timing: boolean
  scheduled_time: string
  start_time: string
  end_time: string
  retry_count: number
  code: string
  language: string
  args: string
  variables: string
  result: string
  trigger_position: string
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
