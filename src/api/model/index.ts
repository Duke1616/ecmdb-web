import type * as Model from "./types/model"
import { RGJsonData } from "relation-graph-vue3"
import instance from "@/utils/hy_service"

/** 新增模型 */
export function CreateModelApi(data: Model.CreateModelReq) {
  return instance.post<number>({
    url: "model/create",
    data: data
  })
}

/** 新增模型分组 */
export function CreateModelGroupApi(data: Model.CreateModelGroupReq) {
  return instance.post<number>({
    url: "model/group/create",
    data: data
  })
}

/** 获取模型列表，按照分组 */
export function listModelsApi() {
  return instance.post<Model.listModelsResponseData>({
    url: "model/list/pipeline"
  })
}

/** 获取模型拓扑图 */
export function listModelGraphApi() {
  return instance.post<RGJsonData>({
    url: "model/relation/graph"
  })
}