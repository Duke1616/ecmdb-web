// 工作空间相关类型定义

export interface Workspace {
  id: number
  name: string
  enabled: boolean
  team_id: number
  template_id: number
  is_public: boolean
  allow_invite: boolean
  ctime: string
  utime: string
}

export interface SaveWorkspaceReq {
  id?: number
  name: string
  enabled: boolean
  team_id: number
  template_id?: number
  is_public: boolean
  allow_invite: boolean
}

export interface ListWorkspacesReq {
  teamId?: number
  offset: number
  limit: number
  keyword?: string
  type?: string
  status?: string
}

export interface ListWorkspacesResponse {
  workspaces: Workspace[]
  total: number
}

export interface WorkspaceCategory {
  id: number
  name: string
  workspaces: Workspace[]
  sort: number
  createdAt: string
  updatedAt: string
}

export interface GetWorkspaceCategoriesReq {
  includeWorkspaces?: boolean
  workspaceStatus?: string
}

export interface GetWorkspaceCategoriesResponse {
  categories: WorkspaceCategory[]
}

// 根据关键字搜索协作空间请求
export interface ListByKeywordReq {
  keyword: string // 搜索关键字
  offset?: number // 偏移量
  limit?: number // 限制数量
}
