import type * as rota from "./types/rota"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

export function listRotasApi(data: rota.page) {
  return instance.post<rota.rotas>({
    url: `${API_SERVICE.CMDB}/rota/list`,
    data: data
  })
}

/** 创建排班表 */
export function createRotaApi(data: rota.createOrUpdateRotaReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/rota/create`,
    data: data
  })
}

/** 删除排班表 */
export function deleteRotaApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/rota/delete`,
    data: { id: id }
  })
}

/** 更新排班表 */
export function updateRotaApi(data: rota.createOrUpdateRotaReq) {
  return instance.post<rota.rota[]>({
    url: `${API_SERVICE.CMDB}/rota/update`,
    data: data
  })
}

/** 新增常规值班规则 */
export function addShifSchedulingRuleApi(data: rota.addRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/rota/rule/shift_scheduling/add`,
    data: data
  })
}

/** 修改常规值班规则 */
export function updateShifSchedulingRuleApi(data: rota.updateOrDeleteRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/rota/rule/shift_scheduling/update`,
    data: data
  })
}

/** 删除常规值班规则 */
export function deleteShifSchedulingRuleApi(data: rota.updateOrDeleteRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/rota/rule/shift_scheduling/delete`,
    data: data
  })
}

/** 新增临时值班规则 */
export function addShifAdjustmentRuleApi(data: rota.addOrUpdateAdjustmentRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/rota/rule/shift_adjustment/add`,
    data: data
  })
}

/** 新增临时值班规则 */
export function updateShifAdjustmentRuleApi(data: rota.addOrUpdateAdjustmentRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/rota/rule/shift_adjustment/update`,
    data: data
  })
}

/** 删除临时值班规则 */
export function deleteShifAdjustmentRuleApi(data: rota.deleteAdjustmentReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/rota/rule/shift_adjustment/delete`,
    data: data
  })
}

/** 查看 */
export function getRotaRuleById(id: number) {
  return instance.post<rota.rotaRule[]>({
    url: `${API_SERVICE.CMDB}/rota/rule/detail`,
    data: { id: id }
  })
}

/** 查看排班表 */
export function previewSchedule(data: rota.previewScheduleReq) {
  return instance.post<rota.shiftRostered>({
    url: `${API_SERVICE.CMDB}/rota/schedule/preview`,
    data: data
  })
}
