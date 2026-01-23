import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

import { PutPresignedUrlReq, GetPresignedUrlReq, RemoveObjectReq, PresignedUrlRes } from "./types/tools"

/** 获取 Minio Put 签名 */
export function putMinioPresignedUrl(data: PutPresignedUrlReq) {
  return instance.post<PresignedUrlRes>({
    url: `${API_SERVICE.CMDB}/tools/minio/put_presigned_url`,
    data: data
  })
}

/** 获取 Minio Get 签名 */
export function getMinioPresignedUrl(data: GetPresignedUrlReq) {
  return instance.post<PresignedUrlRes>({
    url: `${API_SERVICE.CMDB}/tools/minio/get_presigned_url`,
    data: data
  })
}

/** 删除对象 */
export function removeMinioObject(data: RemoveObjectReq) {
  return instance.post<boolean>({
    url: `${API_SERVICE.CMDB}/tools/minio/object/remove`,
    data: data
  })
}
