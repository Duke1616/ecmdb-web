import type * as runner from "./types/runner"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 列表 */
export function listRunnerApi(data: runner.listRunnerReq) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TASK}/runner/list`,
    data: data
  })
}

/** 注册runner */
export function registerRunnerApi(data: runner.registerOrUpdateReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TASK}/runner/register`,
    data: data
  })
}

/** 删除runner */
export function deleteRunnerApi(id: number) {
  return instance.delete<number>({
    url: `${API_SERVICE.TASK}/runner/delete/${id}`
  })
}

/** 修改runner */
export function updateRunnerAPi(data: runner.registerOrUpdateReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TASK}/runner/update`,
    data: data
  })
}

/** by_ids 列表 */
export function listRunnerByIdsApi(ids: number[]) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TASK}/runner/list/by_ids`,
    data: { ids: ids }
  })
}

/** by_workflow_id 列表 */
export function listRunnerByWorkflowIdApi(workflokId: number) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TASK}/runner/list/by_workflow_id`,
    data: { workflow_id: workflokId }
  })
}

/** by_codebook_id 列表 */
export function listRunnerByCodebookIdApi(data: runner.listByCodebookIdReq) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TASK}/runner/list/by_codebook_id`,
    data: data
  })
}

/** exclude_codebook_id 列表 */
export function listRunnerExcludeCodebookIdApi(data: runner.listByCodebookIdReq) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TASK}/runner/list/exclude_codebook_id`,
    data: data
  })
}
