import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  ListWorkspacesReq,
  ListWorkspacesResponse,
  SaveWorkspaceReq,
  Workspace,
  GetWorkspaceCategoriesReq,
  GetWorkspaceCategoriesResponse,
  ListByKeywordReq
} from "./types"

export const listWorkspacesApi = (data: ListWorkspacesReq) => {
  return instance.post<ListWorkspacesResponse>({
    url: `${API_SERVICE.ALERT}/workspace/list`,
    data
  })
}

export const listWorkspacesByTeamApi = (teamId: number) => {
  return instance.get<ListWorkspacesResponse>({
    url: `${API_SERVICE.ALERT}/workspace/list/by_team/${teamId}`
  })
}

export const listMyTeamsApi = () => {
  return instance.get<ListWorkspacesResponse>({
    url: `${API_SERVICE.ALERT}/workspace/list/my_team`
  })
}

export const saveWorkspaceApi = (data: SaveWorkspaceReq) => {
  return instance.post<Workspace>({
    url: `${API_SERVICE.ALERT}/workspace/save`,
    data
  })
}

export const deleteWorkspaceApi = (data: { id: number }) => {
  return instance.post<{ success: boolean }>({
    url: `${API_SERVICE.ALERT}/workspace/delete`,
    data
  })
}

export const getWorkspaceDetailApi = (id: number) => {
  return instance.get<Workspace>({
    url: `${API_SERVICE.ALERT}/workspace/detail/${id}`
  })
}

export const getWorkspaceCategoriesApi = (data: GetWorkspaceCategoriesReq) => {
  return instance.post<GetWorkspaceCategoriesResponse>({
    url: `${API_SERVICE.ALERT}/workspace/categories`,
    data
  })
}

// 根据关键字搜索协作空间
export const listWorkspacesByKeywordApi = (data: ListByKeywordReq) => {
  return instance.post<ListWorkspacesResponse>({
    url: `${API_SERVICE.ALERT}/workspace/list/by_keyword`,
    data
  })
}
