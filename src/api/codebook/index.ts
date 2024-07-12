import type * as codebook from "./types/codebook"
import instance from "@/utils/hy_service"

/** 新增 */
export function createCodebookApi(data: codebook.createOrUpdateCodebookReq) {
  return instance.post<number>({
    url: "codebook/create",
    data: data
  })
}

/** 修改 */
export function updateCodebookApi(data: codebook.createOrUpdateCodebookReq) {
  return instance.post<number>({
    url: "codebook/update",
    data: data
  })
}

/** 列表 */
export function listCodebookApi(data: codebook.listCodebookReq) {
  return instance.post<codebook.codebooks>({
    url: "codebook/list",
    data: data
  })
}

/** 详情 */
export function detailCodebookApi(id: number) {
  return instance.post<codebook.codebooks>({
    url: "codebook/list",
    data: { id: id }
  })
}

/** 删除 */
export function deleteCodebookApi(id: number) {
  return instance.post<number>({
    url: "codebook/delete",
    data: { id: id }
  })
}
