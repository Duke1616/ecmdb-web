import type * as runner from "./types/runner"
import instance from "@/utils/hy_service"

/** 列表 */
export function listRunnerApi(data: runner.listRunnerReq) {
  return instance.post<runner.runners>({
    url: "runner/list",
    data: data
  })
}

/** 查看标签 */
export function listRunnerTagsApi() {
  return instance.post<runner.runnerTagResp>({
    url: "runner/list/tags"
  })
}

/** 注册runner */
export function registerRunnerApi(data: runner.registerOrUpdateReq) {
  return instance.post<number>({
    url: "runner/register",
    data: data
  })
}

/** 删除runner */
export function deleteRunnerApi(id: number) {
  return instance.post<number>({
    url: "runner/delete",
    data: { id: id }
  })
}

/** 修改runner */
export function updateRunnerAPi(data: runner.registerOrUpdateReq) {
  return instance.post<number>({
    url: "runner/update",
    data: data
  })
}
