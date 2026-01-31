import * as order from "./types/order"
import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 新增工单 */
export function createOrderApi(data: order.createOrderReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/order/create`,
    data: data
  })
}

/** 查看待办工单 */
export function todoOrderApi(data: order.todoOrderReq) {
  return instance.post<order.ordersListRes>({
    url: `${API_SERVICE.CMDB}/order/todo`,
    data: data
  })
}

/** 撤销工单 */
export function revokeOrderApi(data: order.revokeOrderReq) {
  return instance.post<boolean>({
    url: `${API_SERVICE.CMDB}/order/revoke`,
    data: data
  })
}

/** 查看我受办待处理工单 */
export function todoOrderByUserApi(data: order.todoOrderReq) {
  return instance.post<order.ordersListRes>({
    url: `${API_SERVICE.CMDB}/order/todo/user`,
    data: data
  })
}

/** 查看我提交的待处理工单 */
export function startByOrderApi(data: order.startByOrderReq) {
  return instance.post<order.ordersListRes>({
    url: `${API_SERVICE.CMDB}/order/start/user`,
    data: data
  })
}

/** 查看我的工单 */
export function getOrderByProcessInstIdApi(processInstId: number) {
  return instance.post<order.order>({
    url: `${API_SERVICE.CMDB}/order/detail/process_inst_id`,
    data: { process_instance_id: processInstId }
  })
}

/** 查看历史工单 */
export function getHisotryOrderApi(data: order.historyOrderReq) {
  return instance.post<order.orders>({
    url: `${API_SERVICE.CMDB}/order/history`,
    data: data
  })
}

/** 同意工单 */
export function passOrderApi(data: order.passOrder) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/order/pass`,
    data: data
  })
}

/** 驳回工单 */
export function rejectOrderApi(data: order.rejectOrder) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/order/reject`,
    data: data
  })
}

/** 工单历史任务记录 */
export function orderTaskRecordsApi(data: order.taskRecordReq) {
  return instance.post<order.taskRecords>({
    url: `${API_SERVICE.CMDB}/order/task/record`,
    data: data
  })
}

/** 获取任务表单配置 */
export function getTaskFormConfigApi(data: order.TaskFormConfigReq) {
  return instance.post<any[]>({
    url: `${API_SERVICE.CMDB}/order/task/form_config`,
    data: data
  })
}
