import type * as rota from "./types/rota"
import instance from "@/common/utils/hy_service"

export function listRotasApi(data: rota.page) {
  return instance.post<rota.rotas>({
    url: "rota/list",
    data: data
  })
}

/** 创建排班表 */
export function createRotaApi(data: rota.createOrUpdateRotaReq) {
  return instance.post<number>({
    url: "rota/create",
    data: data
  })
}

/** 删除排班表 */
export function deleteRotaApi(id: number) {
  return instance.post<number>({
    url: "rota/delete",
    data: { id: id }
  })
}

/** 更新排班表 */
export function updateRotaApi(data: rota.createOrUpdateRotaReq) {
  return instance.post<rota.rota[]>({
    url: "rota/update",
    data: data
  })
}

/** 新增常规值班规则 */
export function addShifSchedulingRuleApi(data: rota.addRuleReq) {
  return instance.post<number>({
    url: "rota/rule/shift_scheduling/add",
    data: data
  })
}

/** 修改常规值班规则 */
export function updateShifSchedulingRuleApi(data: rota.updateOrDeleteRuleReq) {
  return instance.post<number>({
    url: "rota/rule/shift_scheduling/update",
    data: data
  })
}

/** 删除常规值班规则 */
export function deleteShifSchedulingRuleApi(data: rota.updateOrDeleteRuleReq) {
  return instance.post<number>({
    url: "rota/rule/shift_scheduling/delete",
    data: data
  })
}

/** 新增临时值班规则 */
export function addShifAdjustmentRuleApi(data: rota.addOrUpdateAdjustmentRuleReq) {
  return instance.post<number>({
    url: "rota/rule/shift_adjustment/add",
    data: data
  })
}

/** 新增临时值班规则 */
export function updateShifAdjustmentRuleApi(data: rota.addOrUpdateAdjustmentRuleReq) {
  return instance.post<number>({
    url: "rota/rule/shift_adjustment/update",
    data: data
  })
}

/** 删除临时值班规则 */
export function deleteShifAdjustmentRuleApi(data: rota.deleteAdjustmentReq) {
  return instance.post<number>({
    url: "rota/rule/shift_adjustment/delete",
    data: data
  })
}

/** 查看 */
export function getRotaRuleById(id: number) {
  return instance.post<rota.rotaRule[]>({
    url: "rota/rule/detail",
    data: { id: id }
  })
}

/** 查看排班表 */
export function previewSchedule(data: rota.previewScheduleReq) {
  return instance.post<rota.shiftRostered>({
    url: "rota/schedule/preview",
    data: data
  })
}
