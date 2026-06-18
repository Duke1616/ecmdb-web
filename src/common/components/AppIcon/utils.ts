import type { Component } from "vue"
import * as ElementPlusIconsVue from "@element-plus/icons-vue"
import { commonIconList } from "@/common/components/CustomIconSelect/constants"
import type { AppIconSource } from "./types"

export const elementIconMap = ElementPlusIconsVue as Record<string, Component>

const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"]

export const isImageIcon = (value?: string) => {
  if (!value) return false
  if (value.startsWith("http://") || value.startsWith("https://")) return true
  if (value.startsWith("data:image/")) return true
  return imageExtensions.some((ext) => value.toLowerCase().endsWith(ext))
}

export const getIconfontClass = (value: string) => {
  if (value.includes("iconfont")) return value.split(/\s+/).filter(Boolean)
  return ["iconfont", value]
}

export const resolveAppIconSource = (value?: string): AppIconSource => {
  if (!value) return "empty"
  if (isImageIcon(value)) return "image"
  if (value.startsWith("fa ") || value.startsWith("fa-")) return "font-awesome"
  if (
    value.includes("iconfont") ||
    value.startsWith("icon-") ||
    value.startsWith("caise-") ||
    value.startsWith("monitor-") ||
    value.startsWith("ops-") ||
    commonIconList.includes(value)
  ) {
    return "iconfont"
  }
  if (elementIconMap[value]) return "element"
  return "e-icon"
}

export const normalizeFontAwesomeClass = (value: string) => {
  if (value.startsWith("fa ")) return value
  return `fa ${value}`
}
