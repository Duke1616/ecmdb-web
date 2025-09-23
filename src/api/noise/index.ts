import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type { RetrieveNoiseConfig, GetNoiseConfigReq, SaveInhibitRuleReq, SaveInhibitRuleResponse } from "./types"

export const getNoiseConfigApi = (data: GetNoiseConfigReq) => {
  return instance.get<RetrieveNoiseConfig>({
    url: `${API_SERVICE.ALERT}/workspace/noise_config/${data.workspace_id}`,
    data
  })
}

export const saveInhibitRuleApi = (data: SaveInhibitRuleReq) => {
  return instance.post<SaveInhibitRuleResponse>({
    url: `${API_SERVICE.ALERT}/inhibit/save`,
    data
  })
}
