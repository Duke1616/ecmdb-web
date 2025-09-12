<template>
  <div class="file-upload-wrapper">
    <el-upload
      v-model:file-list="fileList"
      class="upload-file"
      action="#"
      multiple
      show-file-list
      :http-request="handleUpload"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :before-remove="beforeRemove"
      :limit="limit"
      :on-exceed="handleExceed"
      :on-progress="handleProgress"
      drag
    >
      <div class="upload-dragger">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="upload-text">
          <p class="upload-title">{{ title }}</p>
          <p class="upload-hint">{{ hint }}</p>
        </div>
      </div>
    </el-upload>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { Upload } from "@element-plus/icons-vue"
import {
  type UploadProps,
  type UploadProgressEvent,
  type UploadRequestOptions,
  type UploadUserFile,
  ElMessage,
  ElMessageBox
} from "element-plus"
import { h } from "vue"
import { putMinioPresignedUrl, removeMinioObject } from "@/api/tools"
import { setCustomFieldApi } from "@/api/resource"
import axios from "axios"
import { decodedUrlPath, getLocalMinioUrl } from "@/common/utils/url"

interface Props {
  modelValue: UploadUserFile[]
  fieldUid: string
  resourceId?: number
  title?: string
  hint?: string
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: "点击或拖拽文件到此处上传",
  hint: "支持多文件上传，最多5个文件",
  limit: 5
})

const emits = defineEmits<{
  "update:modelValue": [value: UploadUserFile[]]
  "upload-success": [file: UploadUserFile, fieldUid: string]
  "upload-error": [error: any, fieldUid: string]
  "remove-success": [file: UploadUserFile, fieldUid: string]
  "remove-error": [error: any, fieldUid: string]
}>()

const fileList = ref<UploadUserFile[]>(props.modelValue || [])

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    fileList.value = newValue || []
  },
  { deep: true }
)

// 监听内部值变化
watch(
  fileList,
  (newValue) => {
    emits("update:modelValue", newValue)
  },
  { deep: true }
)

const handleUpload = (action: UploadRequestOptions) => {
  const objectName = action.file.uid + "/" + action.file.name
  return putMinioPresignedUrl(objectName)
    .then((res: any) => {
      const url = getLocalMinioUrl(res.data)
      // 请求上传
      return axios
        .put(url, action.file, {
          headers: {
            "Content-Type": action.file.type
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              action.onProgress?.({
                percent: percent
              } as UploadProgressEvent)
            }
          }
        })
        .then(() => res.data) // 返回 res.data 供后续使用
    })
    .then((resData) => {
      // 更新文件对象的 URL
      const fileIndex = fileList.value.findIndex((f) => f.name === action.file.name)
      if (fileIndex !== -1) {
        fileList.value[fileIndex].url = getLocalMinioUrl(resData)
        fileList.value[fileIndex].status = "success"
      }

      // 如果有资源ID，调用自定义字段API
      if (props.resourceId) {
        return setCustomFieldApi({
          id: props.resourceId,
          field: props.fieldUid,
          data: fileList.value
        }).then(() => {
          emits("upload-success", fileList.value[fileIndex], props.fieldUid)
        })
      } else {
        emits("upload-success", fileList.value[fileIndex], props.fieldUid)
      }
    })
    .catch((error) => {
      console.error("Upload failed:", error)
      emits("upload-error", error, props.fieldUid)
      throw error
    })
}

const handleRemove: UploadProps["onRemove"] = (file) => {
  console.log("handleRemove", file)
  if (file.url === undefined) {
    console.log("No URL found for file:", file.name)
    return
  }

  removeMinioObject(decodedUrlPath(file.url))
    .then(() => {
      const updatedFiles = fileList.value.filter((item: UploadUserFile) => item.name !== file.name)

      // 更新本地 fileList
      fileList.value = updatedFiles

      // 如果有资源ID，调用自定义字段API
      if (props.resourceId) {
        return setCustomFieldApi({
          id: props.resourceId,
          field: props.fieldUid,
          data: updatedFiles
        }).then(() => {
          emits("remove-success", file, props.fieldUid)
        })
      } else {
        emits("remove-success", file, props.fieldUid)
      }
    })
    .catch((error) => {
      console.error("Remove failed:", error)
      emits("remove-error", error, props.fieldUid)
    })
}

const handleProgress = (event: UploadProgressEvent, file: UploadUserFile) => {
  file.percentage = event.percent
}

const handlePreview: UploadProps["onPreview"] = (uploadFile) => {
  console.log("Preview file:", uploadFile)
}

const handleExceed: UploadProps["onExceed"] = (files) => {
  ElMessage.warning(`限制最多上传 ${files.length} 个文件`)
}

const beforeRemove: UploadProps["beforeRemove"] = (uploadFile) => {
  return ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除文件: "),
      h("i", { style: "color: red" }, `${uploadFile.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => true)
    .catch(() => false)
}
</script>

<style lang="scss" scoped>
.file-upload-wrapper {
  width: 100%;

  .upload-file {
    width: 100%;

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 120px;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      background: #fafafa;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        border-color: #3b82f6;
        background: #f0f9ff;
      }
    }

    .upload-dragger {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;

      .upload-icon {
        font-size: 32px;
        color: #9ca3af;
        margin-bottom: 12px;
        transition: color 0.3s ease;
      }

      .upload-text {
        .upload-title {
          font-size: 14px;
          color: #374151;
          margin: 0 0 4px 0;
          font-weight: 500;
        }

        .upload-hint {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }
      }
    }

    :deep(.el-upload-list) {
      margin-top: 12px;
    }

    :deep(.el-upload-list__item) {
      transition: all 0.3s ease !important;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      margin-top: 8px;
      padding: 8px 12px;
      background: #fff;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
      }
    }

    :deep(.el-upload-list__item-name) {
      color: #374151;
      font-size: 13px;
      font-weight: 500;
    }

    :deep(.el-upload-list__item-status-label) {
      color: #10b981;
      font-size: 12px;
    }

    :deep(.el-upload-list__item-delete) {
      color: #ef4444;
      font-size: 14px;

      &:hover {
        color: #dc2626;
      }
    }
  }
}
</style>
