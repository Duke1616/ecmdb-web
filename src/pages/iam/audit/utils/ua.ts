import { UAParser } from "ua-parser-js"

export interface ParsedClientEnv {
  os: string
  browser: string
  summary: string
}

/**
 * 使用业界成熟开源库 ua-parser-js 解析 User-Agent
 */
export function formatUserAgent(ua?: string): ParsedClientEnv {
  if (!ua || !ua.trim()) {
    return {
      os: "--",
      browser: "--",
      summary: "--"
    }
  }

  const parser = new UAParser(ua)
  const result = parser.getResult()

  const osName = result.os.name || ""
  const osVersion = result.os.version ? ` ${result.os.version.split(".")[0]}` : ""
  const os = osName ? `${osName}${osVersion}` : "未知系统"

  const browserName = result.browser.name || ""
  const browserMajor = result.browser.major ? ` ${result.browser.major}` : ""
  const browser = browserName ? `${browserName}${browserMajor}` : "未知浏览器"

  // 拼接成精炼的摘要，例如 "macOS · Chrome 128"
  const summary = `${os} · ${browser}`

  return {
    os,
    browser,
    summary
  }
}
