import type * as runner from "./types/runner"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 列表 */
export function listRunnerApi(data: runner.listRunnerReq) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TICKET}/runner/list`,
    data: data
  })
}

/** 查看标签 */
export function listRunnerTagsApi() {
  return instance.post<runner.runnerTagResp>({
    url: `${API_SERVICE.TICKET}/runner/list/tags`
  })
}

/** 注册runner */
export function registerRunnerApi(data: runner.registerOrUpdateReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/runner/register`,
    data: data
  })
}

/** 删除runner */
export function deleteRunnerApi(id: number) {
  return instance.delete<number>({
    url: `${API_SERVICE.TICKET}/runner/delete/${id}`
  })
}

/** 修改runner */
export function updateRunnerAPi(data: runner.registerOrUpdateReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TICKET}/runner/update`,
    data: data
  })
}

/** by_ids 列表 */
export function listRunnerByIdsApi(ids: number[]) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TICKET}/runner/list/by_ids`,
    data: { ids: ids }
  })
}

/** by_workflow_id 列表 */
export function listRunnerByWorkflowIdApi(workflokId: number) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TICKET}/runner/list/by_workflow_id`,
    data: { workflow_id: workflokId }
  })
}

/** by_codebook_uid 列表 */
export function listRunnerByCodebookUidApi(data: runner.listByCodebookIdReq) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TICKET}/runner/list/by_codebook_uid`,
    data: data
  })
}

/** exclude_codebook_uid 列表 */
export function listRunnerExcludeCodebookUidApi(data: runner.listByCodebookIdReq) {
  return instance.post<runner.runners>({
    url: `${API_SERVICE.TICKET}/runner/list/exclude_codebook_uid`,
    data: data
  })
}
