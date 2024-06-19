import type * as codebook from "./types/codebook"
import instance from "@/utils/hy_service"

/** 新增 */
export function createCodebookApi(data: codebook.createCodebookReq) {
  return instance.post<number>({
    url: "codebook/create",
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
