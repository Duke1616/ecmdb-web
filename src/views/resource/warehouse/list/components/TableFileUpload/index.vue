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
        <el-button type="primary" size="small" plain :icon="Upload"> 上传文件 </el-button>
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
            <el-button type="success" size="default" plain :icon="Plus" style="width: 100%"> 新增文件 </el-button>
          </el-upload>
        </div>
        <template #reference>
          <el-button type="primary" size="small" plain :icon="View"> 查看 ({{ fileList.length }}) </el-button>
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
import { Upload, Plus, View } from "@element-plus/icons-vue"
import { h } from "vue"
import { getMinioPresignedUrl } from "@/api/tools"
import { getLocalMinioUrl, decodedUrlPath } from "@/common/utils/url"
import { useFileUpload } from "../../composables/useFileUpload"
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

const fileList = ref<UploadUserFile[]>(Array.isArray(props.modelValue) ? props.modelValue : [])

// 使用文件上传 composables
const { uploadFileToMinio, deleteFileFromMinio, updateCustomFieldData, createUploadedFile } = useFileUpload()

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (Array.isArray(newValue)) {
      fileList.value = newValue
    } else {
      fileList.value = []
    }
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

  return uploadFileToMinio(action, (percent) => {
    loading.setText(`已上传 ${percent.toFixed(1)}%`)
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
      return updateCustomFieldData(props.row.id, props.fieldUid, fileList).then(() => {
        const uploadedFile = createUploadedFile(action, resData)
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

const handleRemove: UploadProps["onRemove"] = (file, fileList) => {
  console.log("handleRemove", file)
  if (file.url === undefined) {
    return
  }

  deleteFileFromMinio(file.url)
    .then(() => {
      const updatedFiles = fileList.map((item: UploadUserFile) => (item.name === file.name ? { ...item } : item))

      return updateCustomFieldData(props.row.id, props.fieldUid, updatedFiles).then(() => {
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

    getMinioPresignedUrl({
      object_name: decodedUrlPath(uploadFile.url),
      bucket: "ecmdb"
    }).then((res: any) => {
      window.location.href = getLocalMinioUrl(res.data.url)
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

  // 按钮样式优化
  .el-button {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
