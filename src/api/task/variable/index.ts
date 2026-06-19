import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as variable from "./type"

const VARIABLE_API_PREFIX = `${API_SERVICE.TASK}/variable`

export function createVariableApi(data: variable.CreateVariableReq) {
  return instance.post<number>({
    url: `${VARIABLE_API_PREFIX}/create`,
    data
  })
}

export function listVariablesApi(data: variable.ListVariablesReq) {
  return instance.post<variable.ListVariablesResp>({
    url: `${VARIABLE_API_PREFIX}/list`,
    data
  })
}

export function detailVariableApi(id: number) {
  return instance.get<variable.VariableVO>({
    url: `${VARIABLE_API_PREFIX}/detail/${id}`
  })
}

export function updateVariableApi(data: variable.UpdateVariableReq) {
  return instance.post<void>({
    url: `${VARIABLE_API_PREFIX}/update`,
    data
  })
}

export function deleteVariableApi(id: number) {
  return instance.delete<void>({
    url: `${VARIABLE_API_PREFIX}/delete/${id}`
  })
}
