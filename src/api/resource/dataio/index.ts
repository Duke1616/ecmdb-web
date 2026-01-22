import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as DataIO from "./types"

/**
 * 生成预签名上传 URL
 * NOTE: 前端获取上传 URL 后,使用 PUT 方法直接上传到 S3,不经过后端服务器
 */
export function generateUploadURLApi(data: DataIO.GenerateUploadURLReq) {
  return instance.post<DataIO.GenerateUploadURLRes>({
    url: `${API_SERVICE.CMDB}/dataio/presigned_upload`,
    data
  })
}

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
 * 导入数据 V2 (直接上传文件)
 * NOTE: 直接上传文件到后端,不使用 S3
 */
export function importDataV2Api(data: DataIO.ImportV2Req) {
  const formData = new FormData()
  formData.append("file", data.file)
  formData.append("model_uid", data.model_uid)

  return instance.post<DataIO.ImportRes>({
    url: `${API_SERVICE.CMDB}/dataio/import/v2`,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
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
