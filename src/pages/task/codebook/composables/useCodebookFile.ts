const extLanguageMap: Record<string, string> = {
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

const extIconNameMap: Record<string, string> = {
  py: "python",
  sh: "shell",
  bash: "shell",
  zsh: "shell"
}

export type ScriptFileType = "sh" | "py" | "custom"

export const scriptFileTypeOptions: Array<{ label: string; value: ScriptFileType }> = [
  { label: ".sh", value: "sh" },
  { label: ".py", value: "py" },
  { label: "自定义", value: "custom" }
]

export function getFileExt(name: string) {
  const matched = String(name || "").match(/\.([^.]+)$/)
  return matched?.[1]?.toLowerCase() || ""
}

export function inferLanguage(name: string) {
  return extLanguageMap[getFileExt(name)] || "text"
}

export function getFileIconName(name: string) {
  const iconName = extIconNameMap[getFileExt(name)] || "file"
  return `preserve-color/${iconName}`
}

export function parseScriptFileName(fileName: string): { name: string; type: ScriptFileType } {
  const name = String(fileName || "").trim()
  if (!name) return { name: "", type: "sh" }
  const extension = getFileExt(name)
  if (extension === "sh" || extension === "py") {
    return { name: name.slice(0, -(extension.length + 1)), type: extension }
  }
  return { name, type: "custom" }
}

export function buildScriptFileName(name: string, type: ScriptFileType) {
  const normalized = String(name || "").trim()
  if (!normalized || type === "custom") return normalized
  const suffix = `.${type}`
  return normalized.toLowerCase().endsWith(suffix) ? normalized : `${normalized}${suffix}`
}
