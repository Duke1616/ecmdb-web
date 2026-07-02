import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as invitation from "./type"

/**
 * 创建邀请码
 */
export function createInvitationApi(data: invitation.CreateInvitationReq, tenantId?: number) {
  const headers: Record<string, string> = {}
  if (tenantId !== undefined) {
    headers["X-Active-Tenant-ID"] = String(tenantId)
  }
  return instance.post<{ code: string }>({
    url: `${API_SERVICE.IAM}/invitation/create`,
    data,
    headers
  })
}

/**
 * 校验邀请码 (公开接口)
 */
export function verifyInvitationApi(code: string) {
  return instance.get<invitation.InvitationVO>({
    url: `${API_SERVICE.IAM}/invitation/verify/${code}`
  })
}

/**
 * 接受邀请
 */
export function acceptInvitationApi(data: invitation.AcceptInvitationReq) {
  return instance.post<{ require_approval: boolean }>({
    url: `${API_SERVICE.IAM}/invitation/accept`,
    data
  })
}

/**
 * 获取活跃邀请列表
 */
export function listInvitationsApi(data: invitation.InvitationPageReq, tenantId?: number) {
  const headers: Record<string, string> = {}
  if (tenantId !== undefined) {
    headers["X-Active-Tenant-ID"] = String(tenantId)
  }
  return instance.post<invitation.InvitationPageVO>({
    url: `${API_SERVICE.IAM}/invitation/list`,
    data,
    headers
  })
}

/**
 * 撤回邀请链接
 */
export function revokeInvitationApi(code: string) {
  return instance.delete<void>({
    url: `${API_SERVICE.IAM}/invitation/revoke/${code}`
  })
}

/**
 * 获取入驻申请列表
 */
export function listJoinRequestsApi(data: invitation.JoinRequestPageReq, tenantId?: number) {
  const headers: Record<string, string> = {}
  if (tenantId !== undefined) {
    headers["X-Active-Tenant-ID"] = String(tenantId)
  }
  return instance.post<invitation.JoinRequestPageVO>({
    url: `${API_SERVICE.IAM}/invitation/requests`,
    data,
    headers
  })
}

/**
 * 处理入驻申请
 */
export function handleJoinRequestApi(data: invitation.HandleJoinRequestReq, tenantId?: number) {
  const headers: Record<string, string> = {}
  if (tenantId !== undefined) {
    headers["X-Active-Tenant-ID"] = String(tenantId)
  }
  return instance.post<void>({
    url: `${API_SERVICE.IAM}/invitation/requests/handle`,
    data,
    headers
  })
}

/**
 * 批量撤回邀请链接
 */
export function batchRevokeInvitationApi(data: invitation.BatchRevokeInvitationReq) {
  return instance.post<void>({
    url: `${API_SERVICE.IAM}/invitation/batch_revoke`,
    data
  })
}
