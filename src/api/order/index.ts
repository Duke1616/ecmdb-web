import * as order from "./types/order"
import instance from "@/utils/hy_service"

/** 新增工单 */
export function createOrderApi(data: order.createOrderReq) {
  return instance.post<number>({
    url: "order/create",
    data: data
  })
}

/** TODO 查看待办工单 */
export function todoOrderApi(data: order.todoOrderReq) {
  return instance.post<order.ordersListRes>({
    url: "order/todo",
    data: data
  })
}

/** TODO 查看我的待办工单 */
export function startByOrderApi(data: order.startByOrderReq) {
  return instance.post<order.ordersListRes>({
    url: "order/start/user",
    data: data
  })
}

/** TODO 查看我的工单 */
export function getOrderByProcessInstIdApi(processInstId: number) {
  return instance.post<order.order>({
    url: "order/detail/process_inst_id",
    data: { process_instance_id: processInstId }
  })
}

/** 同意工单 */
export function passOrderApi(data: order.passOrder) {
  return instance.post<number>({
    url: "order/pass",
    data: data
  })
}

/** 驳回工单 */
export function rejectOrderApi(data: order.rejectOrder) {
  return instance.post<number>({
    url: "order/reject",
    data: data
  })
}
