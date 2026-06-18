/**
 * 处理器详情
 */
export interface HandlerDetail {
  name: string
  desc: string
}

/**
 * 执行器信息
 */
export interface Agent {
  name: string
  desc: string
  topic: string
  handlers: HandlerDetail[]
}
