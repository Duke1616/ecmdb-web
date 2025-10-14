import { CHANNEL_TYPES, type ChannelType } from "../../template/types"

// 重新导出渠道类型枚举，方便其他模块使用
export { CHANNEL_TYPES }

// 模板集合
export interface TemplateSet {
  id: number
  owner_id: number
  name: string
  description: string
  ctime: number
  utime: number
  items: TemplateSetItem[]
}

// 模板集合条目
export interface TemplateSetItem {
  id: number
  set_id: number
  channel: ChannelType
  template_id: number
  template_name: string
  ctime: number
}

// 创建模板集合请求
export interface CreateTemplateSetReq {
  name: string
  description: string
  owner_id: number
}

// 创建模板集合响应
export interface CreateTemplateSetResp {
  template_set: TemplateSet
}

// 更新模板集合请求
export interface UpdateTemplateSetReq {
  id: number
  name: string
  description: string
}

// 获取模板集合请求
export interface GetTemplateSetReq {
  id: number
}

// 获取模板集合响应
export interface GetTemplateSetResp {
  template_set: TemplateSet
}

// 删除模板集合请求
export interface DeleteTemplateSetReq {
  id: number
}

// 列表模板集合请求
export interface ListTemplateSetReq {
  offset: number
  limit: number
}

// 列表模板集合响应
export interface RetrieveTemplateSets {
  template_sets: TemplateSet[]
  total: number
}

// 根据ID列表获取模板集合请求
export interface ListTemplateSetsByIDsReq {
  ids: number[] // 模板集合ID列表
}

// 统计条目请求
export interface CountItemsReq {
  set_id: number
}

// 统计条目响应
export interface CountItemsResp {
  total: number
}

// 新增条目请求
export interface AddItemReq {
  set_id: number
  channel: ChannelType
  template_id: number | undefined
}

// 新增条目响应
export interface AddItemResp {
  item: TemplateSetItem
}

// 批量新增条目请求
export interface AddItemsReq {
  set_id: number
  items: AddItemReq[]
}

// 列出条目请求
export interface ListItemsReq {
  set_id: number
}

// 列出条目响应
export interface ListItemsResp {
  items: TemplateSetItem[]
}

// 删除条目请求
export interface DeleteItemsReq {
  set_id: number
  item_ids: number[]
}

// 清空条目请求
export interface DeleteAllItemsReq {
  set_id: number
}

// 解析模板请求
export interface ResolveTemplateReq {
  set_id: number
  channel: ChannelType
}

// 解析模板响应
export interface ResolveTemplateResp {
  template_id: number
}
