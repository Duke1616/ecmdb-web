import instance from "@@/utils/service"
import type * as datasource from "./types/datasource"
import { API_SERVICE } from "@@/utils/service"

/** 获取数据源列表 */
export function listDatasourceApi(data: datasource.ListDatasourceReq) {
  return instance.post<datasource.DatasourceData>({
    url: `${API_SERVICE.ALERT}/datasource/list`,
    data: data
  })
}

/** 获取数据源详情 */
export function getDatasourceApi(id: number) {
  return instance.get<datasource.Datasource>({
    url: `${API_SERVICE.ALERT}/datasource/${id}`
  })
}

/** 保存数据源 */
export function saveDatasourceApi(data: datasource.SaveDatasourceReq) {
  return instance.post<datasource.Datasource>({
    url: `${API_SERVICE.ALERT}/datasource/save`,
    data: data
  })
}

/** 删除数据源 */
export function deleteDatasourceApi(id: number) {
  return instance.delete({
    url: `${API_SERVICE.ALERT}/datasource/${id}`
  })
}

/** 测试数据源连接 */
export function testDatasourceApi(data: datasource.TestDatasourceReq) {
  return instance.post<datasource.TestDatasourceRes>({
    url: `${API_SERVICE.ALERT}/datasource/test`,
    data: data
  })
}

/** 根据数据源类型获取数据源列表 */
export function listDataSourceByTypeApi(data: datasource.ListDataSourceByTypeReq) {
  return instance.post<datasource.Datasource[]>({
    url: `${API_SERVICE.ALERT}/datasource/list/by_datasource_type`,
    data: data
  })
}
