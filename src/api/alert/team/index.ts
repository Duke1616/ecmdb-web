/**
 * 团队管理 API 接口
 */

import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type { ListTeamsReq, RetrieveTeams, SaveTeamReq, Team, GetTeamDetailResponse, DeleteTeamResponse } from "./types"

/**
 * 获取团队列表
 */
export const listTeamsApi = (data: ListTeamsReq) => {
  return instance.post<RetrieveTeams>({
    url: `${API_SERVICE.ALERT}/team/list`,
    data
  })
}

/**
 * 获取团队详情
 */
export const getTeamDetailApi = (id: number) => {
  return instance.get<GetTeamDetailResponse>({
    url: `${API_SERVICE.ALERT}/team/detail/${id}`
  })
}

/**
 * 保存团队
 */
export const saveTeamApi = (data: SaveTeamReq) => {
  return instance.post<Team>({
    url: `${API_SERVICE.ALERT}/team/save`,
    data
  })
}

/**
 * 删除团队
 */
export const deleteTeamApi = (id: number) => {
  return instance.delete<DeleteTeamResponse>({
    url: `${API_SERVICE.ALERT}/team/delete/${id}`
  })
}
