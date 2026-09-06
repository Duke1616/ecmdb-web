import { ElMessage } from "element-plus"

/**
 * 跨环境剪贴板复制工具
 * 优先使用 navigator.clipboard (HTTPS/localhost)；
 * 若处于纯 HTTP 等非安全上下文或浏览器受限，自动降级为 document.execCommand('copy') 兜底，
 * 确保在任何部署环境（无论是否配置 SSL 证书）下都能正常复制。
 *
 * @param text 要复制的文本内容
 * @param successMsg 复制成功提示文案，设为 false 则不提示
 * @returns 是否复制成功
 */
export async function copyToClipboard(text: string, successMsg: string | false = "复制成功"): Promise<boolean> {
  if (!text) return false

  // 1. 优先尝试现代 Clipboard API (仅在 Secure Context 即 HTTPS / localhost 下可用)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      if (successMsg) {
        ElMessage.success(successMsg)
      }
      return true
    } catch {
      // 权限被拒绝或环境限制时，不直接抛错，继续执行下方兜底
    }
  }

  // 2. 降级方案：动态创建隐藏 textarea 结合 document.execCommand('copy')
  try {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.setAttribute("readonly", "readonly")
    textArea.style.position = "fixed"
    textArea.style.top = "0"
    textArea.style.left = "-9999px"
    textArea.style.opacity = "0"
    textArea.style.pointerEvents = "none"

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, text.length)

    const success = document.execCommand("copy")
    document.body.removeChild(textArea)

    if (success) {
      if (successMsg) {
        ElMessage.success(successMsg)
      }
      return true
    }
    throw new Error("execCommand failed")
  } catch (err) {
    ElMessage.error("复制失败")
    console.error("copyToClipboard error:", err)
    return false
  }
}
