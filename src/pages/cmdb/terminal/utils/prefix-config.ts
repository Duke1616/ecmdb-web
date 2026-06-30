// 前缀配置类型定义
export interface PrefixConfig {
  wsServer: string
  prefix: string
}

/**
 * 获取前缀配置
 * 根据当前页面的协议和主机生成 WebSocket 和 HTTP 前缀
 */
/**
 * 获取前缀配置，用于构造后端 HTTP 与 WebSocket 服务地址。
 * - wsServer: 根据页面协议自动选择 ws/wss 并拼接主机名
 * - prefix:   与页面协议/主机构成的基础 HTTP 前缀
 */
export const getPrefixConfig = (): PrefixConfig => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = window.location.host

  return {
    wsServer: `${protocol}//${host}`,
    prefix: `${window.location.protocol}//${window.location.host}`
  }
}

/**
 * 将字节数格式化为人类可读的字符串（B/KB/MB/GB/TB）。
 * @param bytes 原始字节数或可转为数字的字符串
 * @returns 形如 "10.2 MB" 的字符串
 */
export function formatSize(bytes: number | string) {
  const b = Number(bytes) || 0
  if (b < 1024) return `${b} B`
  const units = ["KB", "MB", "GB", "TB"]
  let val = b / 1024
  let i = 0
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024
    i++
  }
  const fixed = val >= 100 ? 0 : val >= 10 ? 1 : 2
  return `${val.toFixed(fixed)} ${units[i]}`
}

/**
 * 将秒数格式化为人类可读的剩余时间字符串（h/m/s）。
 * @param seconds 剩余秒数或可转为数字的字符串
 * @returns 形如 "1h 02m 05s"、"12m 03s" 或 "45s" 的字符串
 */
export function formatETA(seconds: number | string) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}
