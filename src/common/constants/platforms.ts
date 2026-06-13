/**
 * 平台配置常量
 * 统一管理所有平台的配置信息，避免重复定义
 */

import type * as ElementPlusIconsVue from "@element-plus/icons-vue"

type ElementPlusIconsName = keyof typeof ElementPlusIconsVue

export interface PlatformConfig {
  id: string
  name: string
  title: string
  description: string
  icon: ElementPlusIconsName
  color: string
  route: string
  permission: string
  aliases?: string[]
  summary?: string
  metrics?: string[]
}

/**
 * 平台基础配置
 * 包含平台的基本信息，用于菜单管理和导航展示
 */
export const PLATFORMS: PlatformConfig[] = [
  {
    id: "iam",
    name: "身份治理",
    title: "IAM",
    description: "身份、租户、角色、策略与授权关系的统一治理入口",
    icon: "UserFilled",
    color: "#2563EB",
    route: "/governance",
    permission: "iam",
    aliases: ["eiam", "system"],
    summary: "Identity & Access",
    metrics: ["身份主体", "权限策略", "授权审计"]
  },
  {
    id: "task",
    name: "自动化任务",
    title: "TASK",
    description: "任务编排、执行节点、运行日志与自动化作业管理",
    icon: "Operation",
    color: "#059669",
    route: "/cmdb/task/codebook",
    permission: "task",
    aliases: ["etask", "automation"],
    summary: "Automation Jobs",
    metrics: ["任务模板", "执行节点", "运行记录"]
  },
  {
    id: "alert",
    name: "告警响应",
    title: "ALERT",
    description: "告警规则、降噪、升级策略与值班响应管理",
    icon: "Monitor",
    color: "#DC2626",
    route: "/alert/workspace",
    permission: "alert",
    aliases: ["ealert"],
    summary: "Alert Response",
    metrics: ["告警规则", "通知升级", "值班响应"]
  },
  {
    id: "cmdb",
    name: "配置资产",
    title: "CMDB",
    description: "配置项、资源模型、关系拓扑与资产数据治理",
    icon: "DataBoard",
    color: "#EA580C",
    route: "/cmdb/dashboard",
    permission: "cmdb",
    aliases: ["ecmdb"],
    summary: "Configuration Data",
    metrics: ["资源模型", "配置关系", "数据仓库"]
  },
  {
    id: "ticket",
    name: "流程工单",
    title: "TICKET",
    description: "审批流、服务申请、工单流转与流程模板管理",
    icon: "Connection",
    color: "#7C3AED",
    route: "/cmdb/order/start",
    permission: "ticket",
    aliases: ["eflow", "order", "change", "workflow"],
    summary: "Workflow Center",
    metrics: ["服务目录", "流程审批", "变更协同"]
  }
]

/**
 * 获取平台配置
 * @param platformId 平台ID
 * @returns 平台配置对象
 */
export const getPlatformConfig = (platformId: string): PlatformConfig | undefined => {
  return PLATFORMS.find((platform) => platform.id === platformId || platform.aliases?.includes(platformId))
}

export const getPlatformMatchKeys = (platformId: string): string[] => {
  const platform = getPlatformConfig(platformId)
  return platform ? [platform.id, ...(platform.aliases || [])] : [platformId]
}

export const platformMatches = (routePlatforms: string[] | undefined, platformId: string): boolean => {
  if (!routePlatforms || routePlatforms.length === 0) return true
  if (!platformId) return true
  const matchKeys = getPlatformMatchKeys(platformId)
  return routePlatforms.some((platform) => matchKeys.includes(platform))
}

/**
 * 获取所有平台的基础信息（用于菜单管理）
 * @returns 平台基础信息数组
 */
export const getPlatformsForMenu = () => {
  return PLATFORMS.map((platform) => ({
    id: platform.id,
    name: platform.name,
    aliases: platform.aliases
  }))
}

/**
 * 获取所有平台的导航卡片信息（用于首页导航）
 * @returns 导航卡片数组
 */
export const getNavigationCards = () => {
  return PLATFORMS.map((platform) => ({
    id: platform.id,
    name: platform.name,
    title: platform.title,
    description: platform.description,
    icon: platform.icon,
    color: platform.color,
    route: platform.route,
    permission: platform.permission,
    summary: platform.summary,
    metrics: platform.metrics
  }))
}

/**
 * 根据平台ID获取平台名称
 * @param platformId 平台ID
 * @returns 平台名称
 */
export const getPlatformName = (platformId: string): string => {
  const platform = getPlatformConfig(platformId)
  return platform?.name || platformId
}

/**
 * 根据平台ID获取平台标题
 * @param platformId 平台ID
 * @returns 平台标题
 */
export const getPlatformTitle = (platformId: string): string => {
  const platform = getPlatformConfig(platformId)
  return platform?.title || platformId
}
