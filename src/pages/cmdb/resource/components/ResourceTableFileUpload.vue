<template>
  <div class="table-file-upload">
    <el-upload
      v-if="!hasFiles"
      v-model:file-list="fileList"
      class="inline-upload"
      action="#"
      multiple
      :show-file-list="false"
      :http-request="handleUpload"
      :limit="limit"
      :disabled="disabled"
      :on-exceed="handleExceed"
      :on-progress="handleProgress"
    >
      <button type="button" class="file-chip is-empty" :disabled="disabled">
        <el-icon><Upload /></el-icon>
        <span>上传</span>
      </button>
    </el-upload>

    <el-popover
      v-else
      width="336px"
      trigger="click"
      placement="top"
      popper-class="resource-file-popover"
      :show-arrow="false"
    >
      <div class="file-panel">
        <div class="file-panel__head">
          <div class="file-panel__title">
            <el-icon><FolderOpened /></el-icon>
            <span>附件</span>
          </div>
          <span class="file-panel__count">{{ fileList.length }}/{{ limit }}</span>
        </div>

        <el-upload
          v-model:file-list="fileList"
          class="panel-upload"
          action="#"
          multiple
          :show-file-list="false"
          :http-request="handleUpload"
          :limit="limit"
          :disabled="disabled || fileList.length >= limit"
          :on-exceed="handleExceed"
          :on-progress="handleProgress"
        >
          <button type="button" class="add-file-row" :disabled="disabled || fileList.length >= limit">
            <span class="add-file-row__icon">
              <el-icon><Plus /></el-icon>
            </span>
            <span class="add-file-row__text">{{ fileList.length >= limit ? "已达到上传上限" : "添加文件" }}</span>
          </button>
        </el-upload>

        <div class="file-list">
          <div v-for="file in fileList" :key="getFileKey(file)" class="file-row">
            <div class="file-row__icon">
              <el-icon><Document /></el-icon>
            </div>
            <button type="button" class="file-row__name" :title="file.name" @click="downloadFile(file)">
              {{ file.name }}
            </button>
            <span v-if="isUploading(file)" class="file-row__status">上传中</span>
            <div v-else class="file-row__actions">
              <el-tooltip content="下载" placement="top">
                <button type="button" class="icon-action" @click="downloadFile(file)">
                  <el-icon><Download /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip v-if="!disabled" content="删除" placement="top">
                <button type="button" class="icon-action is-danger" @click="handleManualRemove(file)">
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>

      <template #reference>
        <button type="button" class="file-chip">
          <el-icon><FolderOpened /></el-icon>
          <span>附件</span>
          <em>{{ fileList.length }}</em>
        </button>
      </template>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref, watch } from "vue"
import {
  type UploadProgressEvent,
  type UploadRequestOptions,
  type UploadUserFile,
  ElLoading,
  ElMessage,
  ElMessageBox
} from "element-plus"
import { Delete, Document, Download, FolderOpened, Plus, Upload } from "@element-plus/icons-vue"

import { useResourceFileUpload } from "../composables/useResourceFileUpload"
import { useFileDownload } from "@/common/composables/useFileDownload"
import type { Resource } from "@/api/cmdb/resource/types/resource"

interface Props {
  modelValue: UploadUserFile[]
  fieldUid: string
  row: Resource
  limit?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
  disabled: false
})

const emits = defineEmits<{
  "update:modelValue": [value: UploadUserFile[]]
  "upload-success": [file: UploadUserFile, fieldUid: string, row: Resource]
  "upload-error": [error: unknown, fieldUid: string, row: Resource]
  "remove-success": [file: UploadUserFile, fieldUid: string, row: Resource]
  "remove-error": [error: unknown, fieldUid: string, row: Resource]
  preview: [file: UploadUserFile]
}>()

const fileList = ref<UploadUserFile[]>(Array.isArray(props.modelValue) ? props.modelValue : [])

const { uploadFileToMinio, deleteFileFromMinio, updateCustomFieldData, createUploadedFile, removeFileFromList } =
  useResourceFileUpload()
const { downloadMinioFile } = useFileDownload()

const hasFiles = computed(() => fileList.value.length > 0)

watch(
  () => props.modelValue,
  (newValue) => {
    fileList.value = Array.isArray(newValue) ? newValue : []
  },
  { deep: true }
)

watch(
  fileList,
  (newValue) => {
    emits("update:modelValue", newValue)
  },
  { deep: true }
)

const getFileKey = (file: UploadUserFile) => `${file.uid ?? file.url ?? file.name}-${file.name}`

const isUploading = (file: UploadUserFile) => file.status === "uploading" || (file.percentage ?? 100) < 100

const getCurrentRowFiles = () => {
  const files = props.row.data?.[props.fieldUid]
  return Array.isArray(files) ? files : fileList.value
}

const handleUpload = (action: UploadRequestOptions) => {
  if (props.disabled) return Promise.resolve()

  const loading = ElLoading.service({
    text: "正在上传...",
    background: "rgba(15, 23, 42, 0.42)"
  })

  return uploadFileToMinio(action, (percent) => {
    action.onProgress?.({ percent } as UploadProgressEvent)
    loading.setText(`已上传 ${percent.toFixed(0)}%`)
  })
    .then((resData) => {
      const currentFiles = getCurrentRowFiles()
      const file = currentFiles.find((item: UploadUserFile) => item.name === action.file.name)

      if (file) {
        file.url = resData.split("?")[0]
        file.status = "success"
        file.percentage = 100
      }

      return updateCustomFieldData(props.row.id, props.fieldUid, currentFiles).then(() => {
        const uploadedFile = file || createUploadedFile(action, resData)
        fileList.value = [...currentFiles]
        emits("upload-success", uploadedFile, props.fieldUid, props.row)
      })
    })
    .catch((error) => {
      emits("upload-error", error, props.fieldUid, props.row)
      throw error
    })
    .finally(() => {
      loading.close()
    })
}

const handleProgress = (event: UploadProgressEvent, file: UploadUserFile) => {
  file.percentage = event.percent
}

const downloadFile = (file: UploadUserFile) => {
  emits("preview", file)

  if (!file.url) {
    ElMessage.warning("文件地址不存在，暂时无法下载")
    return
  }

  downloadMinioFile(file.url, file.name)
}

const handleExceed = () => {
  ElMessage.warning(`限制最多上传 ${props.limit} 个文件`)
}

const confirmRemove = (file: UploadUserFile) => {
  if (props.disabled) return Promise.resolve(false)

  return ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除文件: "),
      h("i", { style: "color: #dc2626" }, `${file.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => true)
    .catch(() => false)
}

const handleManualRemove = async (file: UploadUserFile) => {
  const confirmed = await confirmRemove(file)
  if (!confirmed) return

  try {
    if (file.url) {
      await deleteFileFromMinio(file.url)
    }

    const updatedFiles = removeFileFromList(fileList.value, file.name)
    await updateCustomFieldData(props.row.id, props.fieldUid, updatedFiles)
    fileList.value = updatedFiles
    emits("remove-success", file, props.fieldUid, props.row)
  } catch (error) {
    emits("remove-error", error, props.fieldUid, props.row)
  }
}
</script>

<style lang="scss" scoped>
.table-file-upload {
  display: inline-flex;
  justify-content: center;
  min-width: 76px;
}

.inline-upload,
.panel-upload {
  line-height: 1;

  :deep(.el-upload) {
    display: block;
    width: 100%;
    line-height: 1;
  }
}

.file-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  min-width: 74px;
  padding: 0 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;

  .el-icon {
    margin-right: 4px;
    color: #64748b;
    font-size: 14px;
  }

  em {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 17px;
    height: 17px;
    padding: 0 5px;
    margin-left: 5px;
    color: #2563eb;
    font-style: normal;
    line-height: 17px;
    background: #eff6ff;
    border-radius: 999px;
  }

  &:hover:not(:disabled) {
    color: #2563eb;
    background: #f8fbff;
    border-color: #9bbcf8;

    .el-icon {
      color: #2563eb;
    }
  }

  &:disabled {
    color: #94a3b8;
    cursor: not-allowed;
    background: #f8fafc;
    border-color: #e2e8f0;

    .el-icon {
      color: #94a3b8;
    }
  }

  &.is-empty {
    color: #64748b;
    border-style: dashed;
  }
}

.file-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
}

.file-panel__title {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;

  .el-icon {
    margin-right: 6px;
    color: #2563eb;
    font-size: 15px;
  }
}

.file-panel__count {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.add-file-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;

  &:hover:not(:disabled) {
    color: #2563eb;
    background: #eff6ff;
    border-color: #93c5fd;
  }

  &:disabled {
    color: #94a3b8;
    cursor: not-allowed;
    background: #f8fafc;
  }
}

.add-file-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  color: inherit;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 5px;
}

.add-file-row__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 224px;
  overflow-y: auto;
}

.file-row {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  column-gap: 8px;
  align-items: center;
  min-height: 36px;
  padding: 4px 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  transition:
    background 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    background: #f8fafc;
    border-color: #edf2f7;
  }
}

.file-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 6px;
}

.file-row__name {
  min-width: 0;
  padding: 0;
  overflow: hidden;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:hover {
    color: #2563eb;
  }
}

.file-row__status {
  padding: 0 6px;
  color: #2563eb;
  font-size: 12px;
  line-height: 20px;
  background: #eff6ff;
  border-radius: 999px;
}

.file-row__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #64748b;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 5px;
  transition:
    color 0.18s ease,
    background 0.18s ease;

  &:hover {
    color: #2563eb;
    background: #eff6ff;
  }

  &.is-danger:hover {
    color: #dc2626;
    background: #fef2f2;
  }
}

:global(.resource-file-popover) {
  padding: 10px !important;
  border: 1px solid #dbe3ef !important;
  border-radius: 8px !important;
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(15, 23, 42, 0.06) !important;
}
</style>
