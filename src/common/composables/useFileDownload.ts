import { getMinioPresignedUrl } from "@/api/tools"
import { getLocalMinioUrl, decodedUrlPath } from "@/common/utils/url"
import { downloadByUrl } from "@/common/utils/file"
import { ElMessage } from "element-plus"

export function useFileDownload() {
  /**
   * 下载 Minio 文件
   * @param fileUrl 原始文件 URL (包含 bucket/path)
   * @param fileName 下载保存的文件名
   * @param bucket bucket 名称，默认为 ecmdb
   */
  const downloadMinioFile = async (fileUrl: string, fileName: string, bucket: string = "ecmdb") => {
    if (!fileUrl) {
      ElMessage.warning("文件链接无效")
      return
    }

    try {
      const res = await getMinioPresignedUrl({
        object_name: decodedUrlPath(fileUrl),
        bucket: bucket
      })
      const downloadUrl = getLocalMinioUrl(res.data.url)
      downloadByUrl(downloadUrl, fileName)
    } catch (error) {
      console.error("文件下载失败:", error)
      ElMessage.error("文件下载失败")
    }
  }

  return {
    downloadMinioFile
  }
}
