<template>
  <div class="table-file-upload">
    <!-- 无文件时显示上传按钮 -->
    <div v-if="!fileList || fileList.length === 0">
      <el-upload
        v-model:file-list="fileList"
        class="upload-file"
        action="#"
        multiple
        show-file-list
        :http-request="handleUpload"
        :limit="limit"
        :on-exceed="handleExceed"
        :on-progress="handleProgress"
      >
        <el-button type="warning" text bg size="small">上传</el-button>
      </el-upload>
    </div>

    <!-- 有文件时显示查看按钮和文件列表 -->
    <div v-else>
      <el-popover width="300px" trigger="click" placement="top">
        <div class="upload-container">
          <el-upload
            v-model:file-list="fileList"
            class="upload-file"
            action="#"
            multiple
            show-file-list
            :http-request="handleUpload"
            :limit="limit"
            :on-exceed="handleExceed"
            :on-progress="handleProgress"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
          >
            <el-button type="primary" text bg size="default" style="width: 100%; text-align: center">
              新增文件
            </el-button>
          </el-upload>
        </div>
        <template #reference>
          <el-button type="primary" text bg size="small"> 查看 ({{ fileList.length }}) </el-button>
        </template>
      </el-popover>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import {
  type UploadProps,
  type UploadProgressEvent,
  type UploadRequestOptions,
  type UploadUserFile,
  ElMessage,
  ElMessageBox,
  ElLoading
} from "element-plus"
import { h } from "vue"
import { putMinioPresignedUrl, removeMinioObject, getMinioPresignedUrl } from "@/api/tools"
import { setCustomFieldApi } from "@/api/resource"
import axios from "axios"
import { decodedUrlPath, getLocalMinioUrl } from "@/common/utils/url"
import type { Resource } from "@/api/resource/types/resource"

interface Props {
  modelValue: UploadUserFile[]
  fieldUid: string
  row: Resource
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5
})

const emits = defineEmits<{
  "update:modelValue": [value: UploadUserFile[]]
  "upload-success": [file: UploadUserFile, fieldUid: string, row: Resource]
  "upload-error": [error: any, fieldUid: string, row: Resource]
  "remove-success": [file: UploadUserFile, fieldUid: string, row: Resource]
  "remove-error": [error: any, fieldUid: string, row: Resource]
  preview: [file: UploadUserFile]
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
  const loading = ElLoading.service({
    text: "正在上传...",
    background: "rgba(0, 0, 0, 0.7)"
  })

  const objectName = action.file.uid + "/" + action.file.name
  return putMinioPresignedUrl(objectName)
    .then((res: any) => {
      const url = getLocalMinioUrl(res.data)

      return axios
        .put(url, action.file, {
          headers: {
            "Content-Type": action.file.type
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              loading.setText(`已上传 ${percentCompleted.toFixed(1)}%`)
            }
          }
        })
        .then(() => res.data)
    })
    .then((resData) => {
      loading.close()

      // 填写URL信息
      const fileList = props.row.data[props.fieldUid] || []
      const file = fileList.find((item: UploadUserFile) => item.name === action.file.name)
      if (file) {
        file.url = resData.split("?")[0]
      }

      // 调用接口更新字段信息
      return setCustomFieldApi({
        id: props.row.id,
        field: props.fieldUid,
        data: fileList
      }).then(() => {
        const uploadedFile: UploadUserFile = {
          name: action.file.name,
          url: getLocalMinioUrl(resData),
          uid: action.file.uid,
          status: "success"
        }
        emits("upload-success", uploadedFile, props.fieldUid, props.row)
      })
    })
    .catch((error) => {
      loading.close()
      console.error("Upload failed:", error)
      emits("upload-error", error, props.fieldUid, props.row)
      throw error
    })
}

const handleRemove: UploadProps["onRemove"] = (file) => {
  console.log("handleRemove", file)
  if (file.url === undefined) {
    return
  }

  removeMinioObject(decodedUrlPath(file.url))
    .then(() => {
      const updatedFiles = fileList.value.map((item: UploadUserFile) => (item.name === file.name ? { ...item } : item))

      return setCustomFieldApi({
        id: props.row.id,
        field: props.fieldUid,
        data: updatedFiles
      }).then(() => {
        emits("remove-success", file, props.fieldUid, props.row)
      })
    })
    .catch((error) => {
      console.error("Remove failed:", error)
      emits("remove-error", error, props.fieldUid, props.row)
    })
}

const handleProgress = (event: UploadProgressEvent, file: UploadUserFile) => {
  file.percentage = event.percent
}

const handlePreview: UploadProps["onPreview"] = (uploadFile) => {
  ElMessageBox({
    title: "下载确认",
    message: h("p", null, [
      h("span", null, "正在下载文件: "),
      h("i", { style: "color: red" }, `${uploadFile.name}`),
      h("span", null, " 确认下载？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    if (uploadFile?.url === undefined) {
      return
    }

    getMinioPresignedUrl(decodedUrlPath(uploadFile.url)).then((res: any) => {
      window.location.href = getLocalMinioUrl(res.data)
    })
  })

  emits("preview", uploadFile)
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
  }).then(() => true)
}
</script>

<style lang="scss" scoped>
.table-file-upload {
  .upload-file {
    :deep(.el-upload) {
      width: 100%;
    }

    ::v-deep .el-upload-list__item {
      transition: none !important;
    }
  }
}

.upload-file {
  :deep(.el-upload) {
    width: 100%;
  }

  ::v-deep .el-upload-list__item {
    transition: none !important;
  }
}

.upload-container {
  margin-bottom: 10px;
}
</style>
