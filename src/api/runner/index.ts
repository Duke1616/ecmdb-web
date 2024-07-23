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
