const languageByExtension: Record<string, string> = {
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  py: "python",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "javascript",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown",
  html: "html"
}

const iconByExtension: Record<string, string> = {
  py: "python",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  yaml: "yaml"
}

const typeLabelByExtension: Record<string, string> = {
  py: "Python",
  sh: "Shell",
  bash: "Shell",
  zsh: "Shell",
  yml: "YAML",
  yaml: "YAML"
}

export function getFileExt(name: string) {
  return (
    String(name || "")
      .match(/\.([^.]+)$/)?.[1]
      ?.toLowerCase() || ""
  )
}

export function inferLanguage(name: string) {
  return languageByExtension[getFileExt(name)] || "text"
}

export function getFileIconName(name: string) {
  return `preserve-color/${iconByExtension[getFileExt(name)] || "file"}`
}

export function getFileTypeLabel(name: string) {
  const extension = getFileExt(name)
  return typeLabelByExtension[extension] || (extension ? `${extension.toUpperCase()} 文件` : "文件")
}

export function formatFileSize(value: number) {
  const size = Math.max(0, value || 0)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`
}

/**
 * 下载 Blob 文件
 * @param blob 文件对象
 * @param fileName 文件名
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 通过 URL 下载文件
 * @param url 文件链接
 * @param fileName 文件名
 */
export function downloadByUrl(url: string, fileName: string) {
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
