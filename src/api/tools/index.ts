import instance from "@/utils/hy_service"

/** 获取 Minio 签名 */
export function getMinioPresignedUrl(objectName: string) {
  return instance.post<number>({
    url: "tools/minio/get_presigned_url",
    data: { object_name: objectName }
  })
}
