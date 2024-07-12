import * as order from "./types/order"
import instance from "@/utils/hy_service"

/** 新增工单 */
export function createOrderApi(data: order.createOrderReq) {
  return instance.post<number>({
    url: "order/create",
    data: data
  })
}
