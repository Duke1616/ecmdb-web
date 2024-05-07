import type * as Model from "./types/model"

import instance from "@/utils/hy_service"

/** 获取模型列表，按照分组 */
export function listModelsApi() {
  return instance.post<Model.listModelsResponseData>({
    url: "model/list/pipeline"
  })
}
