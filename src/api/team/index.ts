/**
 * 团队管理 API 接口
 */

import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  ListTeamsReq,
  RetrieveTeams,
  SaveTeamReq,
  Team,
  GetTeamDetailReq,
  GetTeamDetailResponse,
  DeleteTeamReq,
  DeleteTeamResponse
} from "./types"

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
export const getTeamDetailApi = (data: GetTeamDetailReq) => {
  return instance.post<GetTeamDetailResponse>({
    url: `${API_SERVICE.ALERT}/team/detail`,
    data
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
export const deleteTeamApi = (data: DeleteTeamReq) => {
  return instance.post<DeleteTeamResponse>({
    url: `${API_SERVICE.ALERT}/team/delete`,
    data
  })
}
