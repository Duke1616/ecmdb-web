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
