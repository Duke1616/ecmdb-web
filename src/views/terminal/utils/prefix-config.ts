// 前缀配置类型定义
export interface PrefixConfig {
  wsServer: string
  prefix: string
}

/**
 * 获取前缀配置
 * 根据当前页面的协议和主机生成 WebSocket 和 HTTP 前缀
 */
export const getPrefixConfig = (): PrefixConfig => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = window.location.host

  return {
    wsServer: `${protocol}//${host}`,
    prefix: `${window.location.protocol}//${window.location.host}`
  }
}
