/** 菜单元数据 */
export interface Meta {
  title: string
  icon: string
  is_hidden: boolean
  is_keepalive: boolean
  is_affix: boolean
  platforms: string[]
}

/** 菜单项 (授权可见) */
export interface Menu {
  id: number
  parent_id: number
  name: string
  path: string
  component: string
  redirect: string
  meta: Meta
  children?: Menu[]
}

/** 功能能力项 (Action) 详情 */
export interface ActionDetail {
  id: number
  service: string
  group: string
  code: string
  name: string
}

/** 功能分组 */
export interface PermissionGroup {
  name: string
  actions: string[]
}

/** 服务权限条目 */
export interface ServicePermissionEntry {
  code: string
  name: string
  entries: PermissionGroup[]
}

/** 权限清单 (归一化后的新结构) */
export interface PermissionManifest {
  actions: ActionDetail[]
  services: ServicePermissionEntry[]
}
