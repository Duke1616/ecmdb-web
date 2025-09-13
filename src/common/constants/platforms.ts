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
}

/**
 * 平台基础配置
 * 包含平台的基本信息，用于菜单管理和导航展示
 */
export const PLATFORMS: PlatformConfig[] = [
  {
    id: "cmdb",
    name: "资产管理",
    title: "CMDB",
    description: "配置管理数据库，管理IT基础设施和配置项",
    icon: "DataBoard",
    color: "#3B82F6",
    route: "/cmdb/dashboard",
    permission: "cmdb"
  },
  {
    id: "order",
    name: "工单管理",
    title: "工单",
    description: "处理变更申请和工单流程",
    icon: "Tickets",
    color: "#EF4444",
    route: "/cmdb/order/start",
    permission: "order"
  },
  {
    id: "alert",
    name: "告警平台",
    title: "告警平台",
    description: "监控告警管理和处理",
    icon: "Monitor",
    color: "#F59E0B",
    route: "/alert",
    permission: "alert"
  },
  {
    id: "system",
    name: "系统管理",
    title: "系统配置",
    description: "用户、角色、权限等系统配置",
    icon: "Setting",
    color: "#8B5CF6",
    route: "/cmdb/system/user",
    permission: "system"
  },
  {
    id: "change",
    name: "变更平台",
    title: "变更平台",
    description: "IT变更管理和审批流程",
    icon: "Connection",
    color: "#10B981",
    route: "/change",
    permission: "change"
  },
  {
    id: "automation",
    name: "自动化平台",
    title: "自动化平台",
    description: "自动化任务和流程管理",
    icon: "List",
    color: "#6B7280",
    route: "/cmdb/task/codebook",
    permission: "automation"
  }
]

/**
 * 获取平台配置
 * @param platformId 平台ID
 * @returns 平台配置对象
 */
export const getPlatformConfig = (platformId: string): PlatformConfig | undefined => {
  return PLATFORMS.find((platform) => platform.id === platformId)
}

/**
 * 获取所有平台的基础信息（用于菜单管理）
 * @returns 平台基础信息数组
 */
export const getPlatformsForMenu = () => {
  return PLATFORMS.map((platform) => ({
    id: platform.id,
    name: platform.name
  }))
}

/**
 * 获取所有平台的导航卡片信息（用于首页导航）
 * @returns 导航卡片数组
 */
export const getNavigationCards = () => {
  return PLATFORMS.map((platform) => ({
    id: platform.id,
    title: platform.title,
    description: platform.description,
    icon: platform.icon,
    color: platform.color,
    route: platform.route,
    permission: platform.permission
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
