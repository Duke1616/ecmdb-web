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
