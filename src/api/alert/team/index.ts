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
  DeleteTeamResponse,
  BindChatGroupReq,
  UpdateChatGroupReq
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
export const getTeamDetailApi = (id: number) => {
  return instance.get<Team>({
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

/**
 * 绑定群聊
 */
export const bindChatGroupApi = (data: BindChatGroupReq) => {
  return instance.post<any>({
    url: `${API_SERVICE.ALERT}/team/chat/bind`,
    data
  })
}

/**
 * 更新群聊
 */
export const updateChatGroupApi = (data: UpdateChatGroupReq) => {
  return instance.post<any>({
    url: `${API_SERVICE.ALERT}/team/chat/update`,
    data
  })
}

/**
 * 解绑群聊
 */
export const unbindChatGroupApi = (id: number) => {
  return instance.delete<any>({
    url: `${API_SERVICE.ALERT}/team/chat/unbind/${id}`
  })
}
