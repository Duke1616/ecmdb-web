/**
 * 团队管理相关类型定义
 */

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

// 获取团队详情响应
export interface GetTeamDetailResponse {
  /** 团队信息 */
  team: Team
}

// 删除团队响应
export interface DeleteTeamResponse {
  /** 是否删除成功 */
  success: boolean
}
