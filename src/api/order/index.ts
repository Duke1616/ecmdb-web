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
