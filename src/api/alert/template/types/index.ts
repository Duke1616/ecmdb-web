// 模板版本
export interface TemplateVersion {
  id: number
  channelTemplateId: number
  name: string
  signature: string
  content: string
  remark: string
  ctime: number
  utime: number
}

// 渠道模板
export interface ChannelTemplate {
  id: number
  ownerId: number
  name: string
  description: string
  channel: string
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
  channel: string
  version: {
    name: string
    content: string
    remark: string
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
  channel?: string
  keyword?: string
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
