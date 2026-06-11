import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as oncall from "./types/oncall"

/** 获取值班列表 */
export function listOnCallsApi(data: oncall.Page) {
  return instance.post<oncall.OnCalls>({
    url: `${API_SERVICE.ALERT}/oncall/list`,
    data: data
  })
}

/** 创建值班表 */
export function createOnCallApi(data: oncall.CreateOrUpdateOnCallReq) {
  return instance.post<number>({
    url: `${API_SERVICE.ALERT}/oncall/create`,
    data: data
  })
}

/** 删除值班表 */
export function deleteOnCallApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.ALERT}/oncall/delete`,
    data: { id: id }
  })
}

/** 更新值班表 */
export function updateOnCallApi(data: oncall.CreateOrUpdateOnCallReq) {
  return instance.post<oncall.OnCall[]>({
    url: `${API_SERVICE.ALERT}/oncall/update`,
    data: data
  })
}

/** 新增常规值班规则 */
export function addShiftSchedulingRuleApi(data: oncall.AddRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.ALERT}/oncall/rule/shift_scheduling/add`,
    data: data
  })
}

/** 修改常规值班规则 */
export function updateShiftSchedulingRuleApi(data: oncall.UpdateOrDeleteRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.ALERT}/oncall/rule/shift_scheduling/update`,
    data: data
  })
}

// NOTE: 后端并没有提供单独的删除常规规则的接口，若调用是把 rules 列表 update 为空或去掉该项
/** 删除常规值班规则 */
export function deleteShiftSchedulingRuleApi(data: oncall.UpdateOrDeleteRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.ALERT}/oncall/rule/shift_scheduling/update`, // 统一调用更新接口进行覆盖
    data: data
  })
}

/** 新增临时值班规则 */
export function addShiftAdjustmentRuleApi(data: oncall.AddOrUpdateAdjustmentRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.ALERT}/oncall/rule/shift_adjustment/add`,
    data: data
  })
}

/** 修改临时值班规则 */
export function updateShiftAdjustmentRuleApi(data: oncall.AddOrUpdateAdjustmentRuleReq) {
  return instance.post<number>({
    url: `${API_SERVICE.ALERT}/oncall/rule/shift_adjustment/update`,
    data: data
  })
}

/** 删除临时值班规则 */
export function deleteShiftAdjustmentRuleApi(data: oncall.DeleteAdjustmentReq) {
  return instance.post<number>({
    url: `${API_SERVICE.ALERT}/oncall/rule/shift_adjustment/delete`,
    data: data
  })
}

/** 查看值班规则 */
export function getOnCallRuleByIdApi(id: number) {
  return instance.post<oncall.OnCallRule[]>({
    url: `${API_SERVICE.ALERT}/oncall/rule/detail`,
    data: { id: id }
  })
}

/** 查看排班表/排班预览 */
export function previewScheduleApi(data: oncall.PreviewScheduleReq) {
  return instance.post<oncall.ShiftRostered>({
    url: `${API_SERVICE.ALERT}/oncall/schedule/preview`,
    data: data
  })
}
