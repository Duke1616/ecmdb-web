import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as DataIO from "./types"

/**
 * 导出模板
 * NOTE: 下载空白 Excel 模板,用于批量导入数据
 */
export function exportTemplateApi(modelUid: string) {
  return instance.get<Blob>({
    url: `${API_SERVICE.CMDB}/dataio/template/export/${modelUid}`,
    responseType: "blob"
  })
}

/**
 * 导入数据 (S3 模式)
 * NOTE: 前端先通过 generateUploadURLApi 上传文件到 S3,然后调用此接口传入 file_key 进行导入
 */
export function importDataApi(data: DataIO.ImportReq) {
  return instance.post<DataIO.ImportRes>({
    url: `${API_SERVICE.CMDB}/dataio/import`,
    data
  })
}

/**
 * 导出数据
 * NOTE: 导出当前模型的所有资产数据为 Excel 文件
 */
/**
 * 导出数据
 * NOTE: 导出当前模型的资产数据为 Excel 文件，支持筛选和范围选择
 */
export function exportDataApi(data: DataIO.ExportReq) {
  return instance.post<Blob>({
    url: `${API_SERVICE.CMDB}/dataio/export`,
    data,
    responseType: "blob"
  })
}
