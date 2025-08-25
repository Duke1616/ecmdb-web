import instance from "@@/utils/service"

/** 获取 Minio Put 签名 */
export function putMinioPresignedUrl(objectName: string) {
  return instance.post<number>({
    url: "tools/minio/put_presigned_url",
    data: { object_name: objectName }
  })
}

/** 获取 Minio Get 签名 */
export function getMinioPresignedUrl(objectName: string) {
  return instance.post<number>({
    url: "tools/minio/get_presigned_url",
    data: { object_name: objectName }
  })
}

/** 删除对象 */
export function removeMinioObject(objectName: string) {
  return instance.post<number>({
    url: "tools/minio/object/remove",
    data: { object_name: objectName }
  })
}
