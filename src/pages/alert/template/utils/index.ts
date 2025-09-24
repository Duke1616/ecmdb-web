/**
 * 模板相关工具函数
 */

/**
 * 格式化时间戳
 * @param timestamp 时间戳（秒）
 * @returns 格式化后的时间字符串
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/**
 * 格式化 JSON 内容
 * @param content JSON 字符串
 * @returns 格式化后的 JSON 字符串
 */
export const formatJsonContent = (content: string): string => {
  try {
    const jsonObj = JSON.parse(content)
    return JSON.stringify(jsonObj, null, 2)
  } catch {
    return content
  }
}
