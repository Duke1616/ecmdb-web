import { getFileExt } from "@/common/utils/file"

export { getFileExt, getFileIconName, getFileTypeLabel, inferLanguage } from "@/common/utils/file"

export type ScriptFileType = "sh" | "py" | "custom"

export const scriptFileTypeOptions: Array<{ label: string; value: ScriptFileType }> = [
  { label: ".sh", value: "sh" },
  { label: ".py", value: "py" },
  { label: "自定义", value: "custom" }
]

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
