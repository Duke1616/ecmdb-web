import instance from "@@/utils/service"
import type * as Table from "./types/table"

/** 增 */
export function createTableDataApi(data: Table.CreateOrUpdateTableRequestData) {
  return instance
    .post({
      url: "table",
      method: "post",
      data
    })
    .then((response) => {
      return response // 返回原始的响应对象
    })
}

/** 删 */
export function deleteTableDataApi(id: string) {
  return instance.delete({
    url: `table/${id}`,
    method: "delete"
  })
}

/** 改 */
export function updateTableDataApi(data: Table.CreateOrUpdateTableRequestData) {
  return instance.put({
    url: "table",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: Table.GetTableRequestData) {
  return instance.get<Table.GetTableResponseData>({
    url: "table",
    method: "get",
    params
  })
}
