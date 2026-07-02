import { commonIconList, linearIconList, multicolorIconList } from "@/common/components/CustomIconSelect/constants"
import type { AppIconOption, AppIconSourceOption, SelectableAppIconSource } from "./types"
import { isImageIcon } from "./utils"

interface LegacyIconCategory {
  label: string
  value: string
  list: {
    label: string
    value: string
  }[]
}

export const appIconSourceOptions: AppIconSourceOption[] = [
  { label: "Element", value: "element" },
  { label: "FA", value: "font-awesome" },
  { label: "Icon", value: "iconfont" },
  { label: "图片", value: "image" }
]

export const elementIconOptions: AppIconOption[] = [
  { label: "文件夹", value: "Folder", source: "element", keywords: ["folder", "group"] },
  { label: "文档", value: "Document", source: "element", keywords: ["document", "template"] },
  { label: "应用", value: "Grid", source: "element", keywords: ["grid", "app"] },
  { label: "服务", value: "SetUp", source: "element", keywords: ["service", "setup"] },
  { label: "流程", value: "Connection", source: "element", keywords: ["workflow", "flow"] },
  { label: "任务", value: "Operation", source: "element", keywords: ["task"] },
  { label: "日历", value: "Calendar", source: "element", keywords: ["calendar"] },
  { label: "时钟", value: "Clock", source: "element", keywords: ["clock", "time"] },
  { label: "用户", value: "User", source: "element", keywords: ["user"] },
  { label: "设置", value: "Setting", source: "element", keywords: ["setting"] },
  { label: "监控", value: "Monitor", source: "element", keywords: ["monitor"] },
  { label: "数据", value: "DataAnalysis", source: "element", keywords: ["data"] },
  { label: "组件", value: "Box", source: "element", keywords: ["box", "component"] },
  { label: "收藏", value: "Star", source: "element", keywords: ["star"] },
  { label: "告警", value: "Bell", source: "element", keywords: ["bell", "alert"] },
  { label: "锁", value: "Lock", source: "element", keywords: ["lock"] }
]

export const fontAwesomeIconOptions: AppIconOption[] = [
  { label: "服务器", value: "fa-server", source: "font-awesome", keywords: ["server"] },
  { label: "数据库", value: "fa-database", source: "font-awesome", keywords: ["database"] },
  { label: "云", value: "fa-cloud", source: "font-awesome", keywords: ["cloud"] },
  { label: "电脑", value: "fa-desktop", source: "font-awesome", keywords: ["desktop"] },
  { label: "代码", value: "fa-code", source: "font-awesome", keywords: ["code"] },
  { label: "终端", value: "fa-terminal", source: "font-awesome", keywords: ["terminal"] },
  { label: "文件夹", value: "fa-folder-o", source: "font-awesome", keywords: ["folder"] },
  { label: "标签", value: "fa-tags", source: "font-awesome", keywords: ["tag"] },
  { label: "扳手", value: "fa-wrench", source: "font-awesome", keywords: ["tool"] },
  { label: "立方体", value: "fa-cube", source: "font-awesome", keywords: ["cube"] },
  { label: "网格", value: "fa-th-large", source: "font-awesome", keywords: ["grid"] },
  { label: "交换", value: "fa-random", source: "font-awesome", keywords: ["flow"] }
]

const commonIconLabelMap: Record<string, string> = {
  "caise-computer": "服务器/计算机",
  "caise-database": "数据库",
  "caise-network": "网络",
  "caise-public_cloud": "云服务",
  "monitor-host": "主机",
  "ops-setting-basic": "设置",
  "ops-setting-user": "用户",
  "ops-oneterm-gateway": "网关",
  "ops-oneterm-login": "登录网关",
  "caise-folder": "文件夹",
  file: "文件",
  "caise-data_center": "数据中心/首页"
}

const toIconfontOption = (label: string, value: string, keywords: string[] = []): AppIconOption => ({
  label,
  value,
  source: "iconfont",
  keywords
})

const flattenLegacyIconCategories = (categories: LegacyIconCategory[], groupName: string): AppIconOption[] =>
  categories.flatMap((category) =>
    category.list.map((icon) => toIconfontOption(icon.label, icon.value, [groupName, category.label, category.value]))
  )

const mergeDuplicateOptions = (options: AppIconOption[]): AppIconOption[] => {
  const optionMap = new Map<string, AppIconOption>()

  options.forEach((option) => {
    const existing = optionMap.get(option.value)
    if (!existing) {
      optionMap.set(option.value, option)
      return
    }

    optionMap.set(option.value, {
      ...existing,
      keywords: Array.from(new Set([...(existing.keywords || []), option.label, ...(option.keywords || [])]))
    })
  })

  return Array.from(optionMap.values())
}

const legacyIconfontOptions = [
  ...commonIconList.map((value) => toIconfontOption(commonIconLabelMap[value] || value, value, ["常用"])),
  ...flattenLegacyIconCategories(linearIconList, "线性"),
  ...flattenLegacyIconCategories(multicolorIconList, "多色")
]

export const iconfontIconOptions: AppIconOption[] = mergeDuplicateOptions(legacyIconfontOptions)
export const appIconOptions = [...elementIconOptions, ...fontAwesomeIconOptions, ...iconfontIconOptions]

export const appIconOptionsBySource = appIconOptions.reduce<Record<SelectableAppIconSource, AppIconOption[]>>(
  (result, option) => {
    result[option.source].push(option)
    return result
  },
  {
    element: [],
    "font-awesome": [],
    iconfont: []
  }
)

export const getAppIconLabel = (value?: string) => {
  if (!value) return "选择图标"
  if (isImageIcon(value)) return "图片图标"
  return appIconOptions.find((option) => option.value === value)?.label || value
}

export const filterAppIconOptions = (options: AppIconOption[], keyword: string) => {
  const text = keyword.trim().toLowerCase()
  if (!text) return options

  return options.filter((option) => {
    const haystack = [option.label, option.value, ...(option.keywords || [])].join(" ").toLowerCase()
    return haystack.includes(text)
  })
}
