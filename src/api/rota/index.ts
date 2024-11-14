import type * as rota from "./types/rota"
import instance from "@/utils/hy_service"

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

/** 更新排班表 */
export function updateRotaApi(data: rota.createOrUpdateRotaReq) {
  return instance.post<rota.rota[]>({
    url: "rota/update",
    data: data
  })
}

/** 新增常规值班规则 */
export function addShifSchedulingRuleApi(data: rota.addOrUpdateRuleReq) {
  return instance.post<number>({
    url: "rota/rule/shift_scheduling/add",
    data: data
  })
}

/** 新增临时值班规则 */
export function addShifAdjustmentRuleApi(data: rota.addOrUpdateRuleReq) {
  return instance.post<number>({
    url: "rota/rule/shift_adjustment/add",
    data: data
  })
}
