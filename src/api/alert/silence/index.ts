import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type {
  ListSilenceRuleByWorkspaceReq,
  ListSilenceRuleByWorkspaceResponse,
  RenewalSilenceTimeWindowReq,
  SaveSilenceRuleReq,
  SilenceOperationResponse
} from "./types"

export const createSilenceRuleApi = (data: SaveSilenceRuleReq) => {
  return instance.post<SilenceOperationResponse>({
    url: `${API_SERVICE.ALERT}/silence/create`,
    data
  })
}

export const updateSilenceRuleApi = (data: SaveSilenceRuleReq) => {
  return instance.put<SilenceOperationResponse>({
    url: `${API_SERVICE.ALERT}/silence/update`,
    data
  })
}

export const listSilenceRulesByWorkspaceApi = (data: ListSilenceRuleByWorkspaceReq) => {
  return instance.post<ListSilenceRuleByWorkspaceResponse>({
    url: `${API_SERVICE.ALERT}/silence/list/by_workspace`,
    data
  })
}

export const deleteSilenceRuleApi = (id: number) => {
  return instance.delete<SilenceOperationResponse>({
    url: `${API_SERVICE.ALERT}/silence/delete/${id}`
  })
}

export const renewalSilenceTimeWindowApi = (data: RenewalSilenceTimeWindowReq) => {
  return instance.put<SilenceOperationResponse>({
    url: `${API_SERVICE.ALERT}/silence/renewal/time_window`,
    data
  })
}

export const toggleSilenceRuleStatusApi = (id: number) => {
  return instance.put<SilenceOperationResponse>({
    url: `${API_SERVICE.ALERT}/silence/toggle/status/${id}`
  })
}
