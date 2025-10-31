// 通知渠道枚举
export enum CHANNEL_TYPES {
  EMAIL = "EMAIL",
  WECHAT = "WECHAT",
  FEISHU_CARD = "FEISHU_CARD"
}

export type ChannelType = CHANNEL_TYPES | ""

// 默认渠道类型
export const DEFAULT_CHANNEL_TYPE = "" as const

// 模板版本
export interface TemplateVersion {
  id: number
  channelTemplateId: number
  name: string
  signature: string
  content: string
  desc: string
  ctime: number
  utime: number
}

// 渠道模板
export interface ChannelTemplate {
  id: number
  ownerId: number
  name: string
  description: string
  channel: ChannelType
  businessType: number
  activeVersionId: number
  ctime: number
  utime: number
  versions: TemplateVersion[]
}

// 创建模板请求
export interface CreateTemplateReq {
  ownerId: number
  name: string
  description: string
  channel: ChannelType
  version: {
    name: string
    content: string
    desc: string
  }
}

// 创建模板响应
export interface CreateTemplateResp {
  template: ChannelTemplate
}

// 获取模板详情响应 - 后端直接返回模板数据
export type GetTemplateDetailResp = ChannelTemplate

// 更新模板请求
export interface UpdateTemplateReq extends CreateTemplateReq {
  id: number
}

// 更新模板响应
export interface UpdateTemplateResp {
  template: ChannelTemplate
}

// 模板列表请求
export interface ListTemplatesReq {
  offset: number
  limit: number
}

export interface ListTemplatesByChannelReq extends ListTemplatesReq {
  channel: ChannelType
}
// 模板列表响应
export interface ListTemplatesResp {
  templates: ChannelTemplate[]
  total: number
}

// 删除模板响应
export interface DeleteTemplateResp {
  message: string
}

// Fork 版本请求
export interface ForkVersionReq {
  version_name: string
  version_id: number
}

// Fork 版本响应
export interface ForkVersionResp {
  template_version: TemplateVersion
}

// 发布模板请求
export interface PublishTemplateReq {
  template_id: number
  version_id: number
}

// 发布模板响应
export interface PublishTemplateResp {
  message: string
}

// 更新版本请求
export interface UpdateVersionReq {
  version_id: number
  name: string
  signature: string
  content: string
}

// 更新版本响应
export interface UpdateVersionResp {
  message: string
}
