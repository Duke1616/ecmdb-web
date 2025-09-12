import axios from "axios"
import { putMinioPresignedUrl, removeMinioObject } from "@/api/tools"
import { setCustomFieldApi } from "@/api/resource"
import { getLocalMinioUrl, decodedUrlPath } from "@/common/utils/url"
import type { UploadRequestOptions, UploadUserFile } from "element-plus"

/**
 * 文件上传相关的组合式函数
 */
export function useFileUpload() {
  /**
   * 上传文件到 Minio
   * @param action 上传请求选项
   * @param onProgress 进度回调函数
   * @returns Promise<string> 返回上传后的数据
   */
  const uploadFileToMinio = (action: UploadRequestOptions, onProgress?: (percent: number) => void): Promise<string> => {
    const objectName = action.file.uid + "/" + action.file.name
    return putMinioPresignedUrl(objectName).then((res: any) => {
      const url = getLocalMinioUrl(res.data)

      return axios
        .put(url, action.file, {
          headers: {
            "Content-Type": action.file.type
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              onProgress(percent)
            }
          }
        })
        .then(() => res.data)
    })
  }

  /**
   * 从 Minio 删除文件
   * @param fileUrl 文件 URL
   * @returns Promise<void>
   */
  const deleteFileFromMinio = async (fileUrl: string): Promise<void> => {
    await removeMinioObject(decodedUrlPath(fileUrl))
  }

  /**
   * 更新自定义字段数据
   * @param resourceId 资源 ID
   * @param fieldUid 字段 UID
   * @param data 文件数据
   * @returns Promise<void>
   */
  const updateCustomFieldData = async (resourceId: number, fieldUid: string, data: UploadUserFile[]): Promise<void> => {
    await setCustomFieldApi({
      id: resourceId,
      field: fieldUid,
      data: data
    })
  }

  /**
   * 处理上传成功的文件对象
   * @param action 上传请求选项
   * @param resData 上传响应数据
   * @returns UploadUserFile 处理后的文件对象
   */
  const createUploadedFile = (action: UploadRequestOptions, resData: string): UploadUserFile => {
    return {
      name: action.file.name,
      url: resData.split("?")[0], // 截断 URL，去掉查询参数
      uid: action.file.uid,
      status: "success"
    }
  }

  /**
   * 从文件列表中移除指定文件
   * @param fileList 文件列表
   * @param fileName 要移除的文件名
   * @returns UploadUserFile[] 移除后的文件列表
   */
  const removeFileFromList = (fileList: UploadUserFile[], fileName: string): UploadUserFile[] => {
    return fileList.filter((item: UploadUserFile) => item.name !== fileName)
  }

  /**
   * 更新文件列表中的文件 URL
   * @param fileList 文件列表
   * @param fileName 文件名
   * @param url 新的 URL
   * @returns boolean 是否找到并更新了文件
   */
  const updateFileUrlInList = (fileList: UploadUserFile[], fileName: string, url: string): boolean => {
    const fileIndex = fileList.findIndex((f) => f.name === fileName)
    if (fileIndex !== -1) {
      fileList[fileIndex].url = url
      fileList[fileIndex].status = "success"
      return true
    }
    return false
  }

  return {
    uploadFileToMinio,
    deleteFileFromMinio,
    updateCustomFieldData,
    createUploadedFile,
    removeFileFromList,
    updateFileUrlInList
  }
}
