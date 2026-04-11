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
