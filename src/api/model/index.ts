import type * as Model from "./types/model"
import { RGJsonData } from "relation-graph-vue3"
import instance from "@/common/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 新增模型 */
export function CreateModelApi(data: Model.CreateModelReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/model/create`,
    data: data
  })
}

/** 新增模型分组 */
export function CreateModelGroupApi(data: Model.CreateModelGroupReq) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/model/group/create`,
    data: data
  })
}

/** 获取模型列表，按照分组 */
export function ListModelsByGroupApi() {
  return instance.post<Model.listModelsResponseData>({
    url: `${API_SERVICE.CMDB}/model/by_group`
  })
}

/** 获取模型详情 */
export const getModelDetailApi = (id: number) => {
  return instance.get<Model.Model>({
    url: `${API_SERVICE.CMDB}/model/detail/${id}`
  })
}

/** 获取模型拓扑图 */
export function listModelGraphApi() {
  return instance.post<RGJsonData>({
    url: `${API_SERVICE.CMDB}/model/relation/graph`
  })
}

/** 删除模型 */
export function deleteModelApi(model_uid: string) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/model/delete`,
    data: { model_uid: model_uid }
  })
}

export function getByModelUidsApi(uids: string[]) {
  return instance.post<Model.retrieveModelsListResp>({
    url: `${API_SERVICE.CMDB}/model/by_uids`,
    data: { uids: uids }
  })
}

/** 删除模型分组 */
export function deleteModelGroupApi(id: number) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/model/group/delete`,
    data: { id: id }
  })
}
