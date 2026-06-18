import axios from "axios"
import { putMinioPresignedUrl, removeMinioObject } from "@/api/tools"
import { setCustomFieldApi } from "@/api/cmdb/resource"
import { getLocalMinioUrl, decodedUrlPath } from "@/common/utils/url"
import type { UploadRequestOptions, UploadUserFile } from "element-plus"

export function useResourceFileUpload() {
  const uploadFileToMinio = (action: UploadRequestOptions, onProgress?: (percent: number) => void): Promise<string> => {
    const objectName = action.file.uid + "/" + action.file.name
    return putMinioPresignedUrl({
      object_name: objectName,
      bucket: "ecmdb"
    }).then((res) => {
      const url = getLocalMinioUrl(res.data.url)

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
        .then(() => res.data.url)
    })
  }

  const deleteFileFromMinio = async (fileUrl: string): Promise<void> => {
    await removeMinioObject({
      object_name: decodedUrlPath(fileUrl),
      bucket: "ecmdb"
    })
  }

  const updateCustomFieldData = async (resourceId: number, fieldUid: string, data: UploadUserFile[]): Promise<void> => {
    await setCustomFieldApi({
      id: resourceId,
      field: fieldUid,
      data: data
    })
  }

  const createUploadedFile = (action: UploadRequestOptions, resData: string): UploadUserFile => {
    return {
      name: action.file.name,
      url: resData.split("?")[0],
      uid: action.file.uid,
      status: "success"
    }
  }

  const removeFileFromList = (fileList: UploadUserFile[], fileName: string): UploadUserFile[] => {
    return fileList.filter((item: UploadUserFile) => item.name !== fileName)
  }

  return {
    uploadFileToMinio,
    deleteFileFromMinio,
    updateCustomFieldData,
    createUploadedFile,
    removeFileFromList
  }
}
