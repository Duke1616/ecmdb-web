/**
 * 团队管理相关类型定义
 */

import type { ChannelType } from "@/api/alert/template/types"

// 群组信息
export interface ChatGroup {
  /** 群组ID */
  id?: number
  /** 关联的团队ID */
  team_id?: number
  /** 群组名称 */
  name: string
  /** 渠道类型 */
  channel: ChannelType
  /** 群聊的对应ID (如飞书、企业微信的群ID) */
  chat_id: string
  /** 是否是临时群 */
  is_temporary?: boolean
  /** 计划解散/归档的时间戳 */
  expire_time?: number
  /** 创建时间 */
  ctime?: number
  /** 更新时间 */
  utime?: number
}

// 团队信息
export interface Team {
  /** 团队ID */
  id: number
  /** 团队名称 */
  name: string
  /** 管理人员 */
  owner: string
  /** 绑定人员 */
  members: string[]
  /** 关联群组 */
  chat_groups?: ChatGroup[]
  /** 创建时间 */
  ctime: number
  /** 更新时间 */
  utime: number
}

// 保存团队请求参数
export interface SaveTeamReq {
  /** 团队ID */
  id?: number
  /** 团队名称 */
  name: string
  /** 管理人员 */
  owner: string
  /** 绑定人员 */
  members: string[]
  /** 绑定的群聊列表 */
  chat_groups?: ChatGroup[]
}

// 绑定群聊请求参数
export interface BindChatGroupReq {
  team_id: number
  name: string
  channel: ChannelType
  chat_id: string
  is_temporary?: boolean
  expire_time?: number
}

// 更新群聊请求参数
export interface UpdateChatGroupReq {
  id: number
  name: string
  channel: ChannelType
  chat_id: string
  is_temporary?: boolean
  expire_time?: number
}

// 分页参数
export interface Page {
  /** 偏移量 */
  offset: number
  /** 限制数量 */
  limit: number
}

// 获取团队列表请求参数
export interface ListTeamsReq extends Page {}

// 获取团队列表响应
export interface RetrieveTeams {
  /** 团队列表 */
  teams: Team[]
  /** 总数 */
  total: number
}

// 获取团队详情请求参数
export interface GetTeamDetailReq {
  /** 团队ID */
  id: number
}

// 删除团队响应
export interface DeleteTeamResponse {
  /** 是否删除成功 */
  success: boolean
}

// 根据 ID 列表获取群组请求参数
export interface GetChatGroupsByIDsReq {
  ids: number[]
}
