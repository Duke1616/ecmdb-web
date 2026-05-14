import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as policy from "./type"

/** 创建策略 */
export function createPolicyApi(data: policy.CreatePolicyRequest) {
  return instance.post<policy.Policy>({
    url: `${API_SERVICE.IAM}/policy/create`,
    data
  })
}

/** 修改策略 */
export function updatePolicyApi(data: policy.UpdatePolicyRequest) {
  return instance.post<policy.Policy>({
    url: `${API_SERVICE.IAM}/policy/update`,
    data
  })
}

/**
 * 获取策略详情 (包含服务治理汇总)
 */
export function getPolicyDetailApi(code: string) {
  return instance.get<policy.RetriePolicySummaryRes>({
    url: `${API_SERVICE.IAM}/policy/detail/${code}`
  })
}

/** 查询策略列表 */
export function listPoliciesApi(data: policy.ListPolicyRequest) {
  return instance.post<policy.ListPolicyResponse>({
    url: `${API_SERVICE.IAM}/policy/list`,
    data
  })
}

/** 绑定策略到角色 */
export function attachPolicyApi(data: policy.AttachPolicyRequest) {
  return instance.post<boolean>({
    url: `${API_SERVICE.IAM}/policy/attach`,
    data
  })
}

/** 从角色解绑策略 */
export function detachPolicyApi(data: policy.AttachPolicyRequest) {
  return instance.post<boolean>({
    url: `${API_SERVICE.IAM}/policy/detach`,
    data
  })
}

/** 批量绑定策略到主体（支持用户和角色混合） */
export function batchAttachPolicyApi(data: policy.BatchAttachPolicyRequest) {
  return instance.post<policy.BatchAttachPolicyResponse>({
    url: `${API_SERVICE.IAM}/policy/batch-attach`,
    data
  })
}

/** 分页获取用户关联的策略列表 (管理侧) */
export function listUserPoliciesApi(data: policy.ListUserPoliciesReq) {
  return instance.post<policy.ListPolicyResponse>({
    url: `${API_SERVICE.IAM}/policy/list/attached/user`,
    data
  })
}

/** 分页获取角色关联的策略列表 (管理侧) */
export function listRolePoliciesApi(data: policy.ListRolePoliciesReq) {
  return instance.post<policy.ListPolicyResponse>({
    url: `${API_SERVICE.IAM}/policy/list/attached/role`,
    data
  })
}

/** 批量从主体解绑策略 */
export function batchDetachPolicyApi(data: policy.BatchDetachPolicyRequest) {
  return instance.post<number>({
    url: `${API_SERVICE.IAM}/policy/batch-detach`,
    data
  })
}

/** 删除权限策略 */
export function deletePolicyApi(code: string) {
  return instance.delete<string>({
    url: `${API_SERVICE.IAM}/policy/delete/${code}`
  })
}
/** 批量删除权限策略 */
export function batchDeletePoliciesApi(data: policy.BatchDeletePolicyRequest) {
  return instance.post<string>({
    url: `${API_SERVICE.IAM}/policy/batch-delete`,
    data
  })
}
