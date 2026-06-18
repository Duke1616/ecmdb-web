import * as manager from "./types/manager"
import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 提交工单 */
export function submitTicketApi(data: manager.SubmitTicketReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/ticket/submit`,
    data: data
  })
}

/** 查看待办工单 */
export function listTodoTicketsApi(data: manager.TodoTicketReq) {
  return instance.post<manager.TicketListRes>({
    url: `${API_SERVICE.TICKET}/ticket/todo`,
    data: data
  })
}

/** 撤销工单 */
export function revokeTicketApi(data: manager.RevokeTicketReq) {
  return instance.post<boolean>({
    url: `${API_SERVICE.TICKET}/ticket/revoke`,
    data: data
  })
}

/** 查看我受办待处理工单 */
export function listMyTodoTicketsApi(data: manager.TodoTicketReq) {
  return instance.post<manager.TicketListRes>({
    url: `${API_SERVICE.TICKET}/ticket/todo/user`,
    data: data
  })
}

/** 查看我提交的待处理工单 */
export function listStartedTicketsApi(data: manager.StartedTicketReq) {
  return instance.post<manager.TicketListRes>({
    url: `${API_SERVICE.TICKET}/ticket/start/user`,
    data: data
  })
}

/** 查看我的工单 */
export function getTicketByProcessInstIdApi(processInstId: number) {
  return instance.post<manager.Ticket>({
    url: `${API_SERVICE.TICKET}/ticket/detail/process_inst_id`,
    data: { process_instance_id: processInstId }
  })
}

/** 查看历史工单 */
export function listHistoryTicketsApi(data: manager.HistoryTicketReq) {
  return instance.post<manager.TicketsRes>({
    url: `${API_SERVICE.TICKET}/ticket/history`,
    data: data
  })
}

/** 同意工单 */
export function passTicketApi(data: manager.PassTicketReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/ticket/pass`,
    data: data
  })
}

/** 驳回工单 */
export function rejectTicketApi(data: manager.RejectTicketReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/ticket/reject`,
    data: data
  })
}

/** 工单历史任务记录 */
export function listTicketTaskRecordsApi(data: manager.taskRecordReq) {
  return instance.post<manager.taskRecords>({
    url: `${API_SERVICE.TICKET}/ticket/task/record`,
    data: data
  })
}

/** 获取任务表单配置 */
export function getTaskFormConfigApi(data: manager.TaskFormConfigReq) {
  return instance.post<any[]>({
    url: `${API_SERVICE.TICKET}/ticket/task/form_config`,
    data: data
  })
}

/** 转签工单 */
export function transferTicketApi(data: manager.TransferTicketReq) {
  return instance.post<boolean>({
    url: `${API_SERVICE.TICKET}/ticket/transfer`,
    data: data
  })
}
