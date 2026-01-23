import { ref } from "vue"
import { ElMessage } from "element-plus"
import { generateUploadURLApi, exportTemplateApi, importDataApi, exportDataApi } from "@/api/resource/dataio"
import type { GenerateUploadURLReq, ImportReq, ExportReq } from "@/api/resource/dataio/types"
import { downloadBlob } from "@/common/utils/file"

/**
 * 数据导入导出 Composable
 * NOTE: 封装数据导入导出的核心逻辑,包括文件上传、模板导出、数据导入和数据导出
 */
export function useDataIO() {
  const uploading = ref(false)
  const importing = ref(false)
  const exporting = ref(false)

  /**
   * 上传文件到 S3
   * NOTE: 使用预签名 URL 直接上传到 S3,不经过后端服务器
   */
  const uploadFileToS3 = async (file: File): Promise<string> => {
    try {
      uploading.value = true

      // 1. 获取预签名上传 URL
      const req: GenerateUploadURLReq = {
        file_name: file.name
      }

      const { data: uploadData } = await generateUploadURLApi(req)

      // 2. 使用 PUT 方法直接上传到 S3
      const uploadResponse = await fetch(uploadData.upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        }
      })

      if (!uploadResponse.ok) {
        throw new Error(`上传失败: ${uploadResponse.statusText}`)
      }

      ElMessage.success("文件上传成功")
      return uploadData.file_key
    } catch (error) {
      console.error("上传文件失败:", error)
      ElMessage.error("文件上传失败")
      throw error
    } finally {
      uploading.value = false
    }
  }

  /**
   * 导出模板
   * NOTE: 下载空白 Excel 模板,用户填写后可批量导入
   */
  const exportTemplate = async (modelUid: string, modelName?: string) => {
    try {
      exporting.value = true
      ElMessage.info("正在生成模板...")

      const data = await exportTemplateApi(modelUid)

      // 使用工具函数下载文件
      const blob = new Blob([data as any], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })
      const fileName = `${modelName || modelUid}_template.xlsx`
      downloadBlob(blob, fileName)

      ElMessage.success("模板导出成功")
    } catch (error) {
      console.error("导出模板失败:", error)
      ElMessage.error("导出模板失败")
      throw error
    } finally {
      exporting.value = false
    }
  }

  /**
   * 导入数据
   * NOTE: 先上传文件到 S3,然后调用导入接口
   */
  const importData = async (file: File, modelUid: string): Promise<number> => {
    try {
      importing.value = true
      ElMessage.info("正在导入数据,请稍候...")

      // 1. 上传文件到 S3
      const fileKey = await uploadFileToS3(file)

      // 2. 调用导入接口
      const req: ImportReq = {
        model_uid: modelUid,
        file_key: fileKey
      }

      const { data } = await importDataApi(req)

      ElMessage.success(`导入成功,共导入 ${data.imported_count} 条数据`)
      return data.imported_count
    } catch (error) {
      console.error("导入数据失败:", error)
      ElMessage.error("导入数据失败")
      throw error
    } finally {
      importing.value = false
    }
  }

  /**
   * 导出数据
   * NOTE: 导出当前模型的所有资产数据为 Excel 文件
   */
  const exportData = async (req: ExportReq, fileName?: string) => {
    try {
      exporting.value = true
      ElMessage.info("正在导出数据...")

      const data = await exportDataApi(req)

      // 使用工具函数下载文件
      const blob = new Blob([data as any], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })
      const downloadName = fileName || `${req.model_uid}_export_${new Date().getTime()}.xlsx`
      downloadBlob(blob, downloadName)

      ElMessage.success("数据导出成功")
    } catch (error) {
      console.error("导出数据失败:", error)
      ElMessage.error("导出数据失败")
      throw error
    } finally {
      exporting.value = false
    }
  }

  return {
    uploading,
    importing,
    exporting,
    uploadFileToS3,
    exportTemplate,
    importData,
    exportData
  }
}
