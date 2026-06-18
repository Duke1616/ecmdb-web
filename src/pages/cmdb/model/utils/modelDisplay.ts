import type { Model } from "@/api/model/types/model"

export type ModelStatus = "open" | "close" | "unknown"
export type ModelFilterStatus = "all" | Exclude<ModelStatus, "unknown">

export const getModelStatus = (model: Model): ModelStatus => {
  const modelWithStatus = model as Model & {
    status?: string
    state?: string
    enabled?: boolean
    is_active?: boolean
  }

  if (modelWithStatus.enabled === true || modelWithStatus.is_active === true) return "open"
  if (modelWithStatus.enabled === false || modelWithStatus.is_active === false) return "close"

  const rawStatus = String(modelWithStatus.status || modelWithStatus.state)
  if (["open", "enabled", "active", "启用"].includes(rawStatus)) return "open"
  if (["close", "disabled", "inactive", "停用"].includes(rawStatus)) return "close"

  return "unknown"
}

export const isImageUrl = (icon: string): boolean => {
  if (!icon) return false
  if (icon.startsWith("http://") || icon.startsWith("https://")) return true
  if (icon.startsWith("data:image/")) return true

  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"]
  return imageExtensions.some((ext) => icon.toLowerCase().endsWith(ext))
}

export const getIconClass = (iconName: string): string[] => {
  if (!iconName) return ["iconfont"]
  if (iconName.includes("iconfont")) return iconName.split(" ")

  return ["iconfont", iconName]
}
