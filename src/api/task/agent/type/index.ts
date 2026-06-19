/**
 * 处理器详情
 */
export interface HandlerDetail {
  name: string
  desc: string
}

/**
 * 节点详情
 */
export interface NodeDetail {
  id: string
  address: string
}

/**
 * 执行器信息
 */
export interface Agent {
  name: string
  desc: string
  topic: string
  handlers: HandlerDetail[]
  nodes: NodeDetail[]
}

export interface ListAgentsReq {
  limit?: number
  cursor?: string
  keyword?: string
}

export interface ListAgentsResp {
  agents: Agent[]
  next_cursor?: string
  has_more: boolean
}
