import type * as Tables from "./type"
import instance from "@/common/utils/hy_service"

/** 增 */
export function createTableDataApi(data: Tables.CreateOrUpdateTableRequestData) {
  return instance.post({
    url: "tables",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return instance.post({
    url: `tables/${id}`,
    method: "delete"
  })
}

/** 改 */
export function updateTableDataApi(data: Tables.CreateOrUpdateTableRequestData) {
  return instance.post({
    url: "tables",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: Tables.TableRequestData) {
  return instance.post<Tables.TableResponseData>({
    url: "tables",
    method: "get",
    params
  })
}
