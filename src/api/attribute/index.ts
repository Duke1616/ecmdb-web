import type * as attribute from "./types/attribute"

import instance from "@/utils/hy_service"

/** 获取模型字段列表 */
export function listAttributesByModelUidApi(modelUid: string) {
  return instance.post<attribute.listAttributesResponseData>({
    url: "attribute/list",
    data: { model_uid: modelUid }
  })
}
