<template>
  <div class="form-container">
    <el-form 
      ref="formRef" 
      :model="formData" 
      :rules="formRules" 
      size="large" 
      label-position="top"
      class="resource-form"
    >
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基础属性</span>
        </div>

        <!-- 字符串和列表字段 - 两列布局 -->
        <el-row :gutter="20">
          <el-col :span="12" v-for="(item, index) of nonFileFields" :key="index">
            <div class="form-row">
              <el-form-item :prop="'data.' + item.field_uid" :label="item.field_name" class="form-item">
                <template v-if="item.field_type === 'string'">
                  <el-input 
                    v-model="formData.data[item.field_uid]" 
                    :placeholder="handlerPlaceholder(item.field_name)"
                    clearable
                  />
                </template>
                <template v-if="item.field_type === 'list'">
                  <el-select 
                    v-model="formData.data[item.field_uid]" 
                    placeholder="请选择"
                    clearable
                  >
                    <el-option v-for="option in item.option" :key="option" :label="option" :value="option" />
                  </el-select>
                </template>
              </el-form-item>
            </div>
          </el-col>
        </el-row>

        <!-- 多行文本字段 - 两列布局 -->
        <el-row :gutter="20">
          <el-col :span="12" v-for="(item, index) of multilineFields" :key="index">
            <div class="form-row">
              <el-form-item :prop="'data.' + item.field_uid" :label="item.field_name" class="form-item">
                <el-input
                  v-model="formData.data[item.field_uid]"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  type="textarea"
                  :placeholder="handlerPlaceholder(item.field_name)"
                />
              </el-form-item>
            </div>
          </el-col>
        </el-row>

        <!-- 文件上传字段 - 两列布局 -->
        <el-row :gutter="20">
          <el-col :span="12" v-for="(item, index) of fileFields" :key="index">
            <div class="form-row">
              <el-form-item :prop="'data.' + item.field_uid" :label="item.field_name" class="form-item">
                <div class="upload-wrapper">
                  <el-upload
                    v-model:file-list="formData.data[item.field_uid]"
                    class="upload-file"
                    action="#"
                    multiple
                    show-file-list
                    :http-request="(action: UploadRequestOptions) => uploadFile(action, item.field_uid)"
                    :on-preview="handlePreview"
                    :on-remove="createHandleRemove(item.field_uid)"
                    :before-remove="beforeRemove"
                    :limit="5"
                    :on-exceed="handleExceed"
                    :on-progress="handleProgress"
                  >
                    <el-button type="primary" :icon="Upload">文件上传</el-button>
                  </el-upload>
                </div>
              </el-form-item>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, h } from "vue"
import { Setting, Upload } from "@element-plus/icons-vue"
import { createResourceApi, setCustomFieldApi, updateResourceApi } from "@/api/resource"
import { Resource, type CreateOrUpdateResourceReq } from "@/api/resource/types/resource"
import { cloneDeep } from "lodash-es"
import {
  type FormInstance,
  type FormRules,
  ElMessage,
  ElMessageBox,
  UploadProgressEvent,
  UploadProps,
  UploadRequestOptions,
  UploadUserFile
} from "element-plus"
import { Attribute } from "@/api/attribute/types/attribute"
import { putMinioPresignedUrl, removeMinioObject } from "@/api/tools"
import axios from "axios"
import { decodedUrlPath, getLocalMinioUrl } from "@/common/utils/url"

// 接收父组建传递
interface Props {
  modelUid: string
  attributeFiledsData: Attribute[]
}

const props = defineProps<Props>()
const emits = defineEmits(["list", "closed"])
const activeNames = ref<string[]>(["0", "1"])
const DEFAULT_FORM_DATA: CreateOrUpdateResourceReq = {
  name: "",
  model_uid: props.modelUid,
  data: {}
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateOrUpdateResourceReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}
  props.attributeFiledsData.forEach((field) => {
    const dataField = `data.${field.field_uid}`
    rules[dataField] = [
      {
        required: field.required,
        message: `请填写${field.field_name}`,
        trigger: "blur"
      }
    ].filter((rule) => rule.required)
  })
  return rules
})

const handlerPlaceholder = (name: string) => {
  return `请输入${name}`
}

const uploadFile = (action: UploadRequestOptions, fieldUid: string) => {
  const objectName = action.file.uid + "/" + action.file.name
  return putMinioPresignedUrl(objectName).then((res: any) => {
    const url = getLocalMinioUrl(res.data)
    // 请求上传
    axios
      .put(url, action.file, {
        headers: {
          "Content-Type": action.file.type
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            action.onProgress({
              percent: percentCompleted
            } as UploadProgressEvent)

            if (percentCompleted === 100) {
              action.onSuccess && action.onSuccess(action.file)
            }
          }
        }
      })
      .then(() => {
        const fileList = formData.value.data[fieldUid]
        const file = fileList.find((item: UploadUserFile) => item.name === action.file.name)
        if (file) {
          file.url = res.data.split("?")[0]
        }

        // 当为修改的时候，主动调用接口更新字段信息，防止文件已经删除，页面依旧展示
        // 如果新增情况下，主动上传文件不触发保存 Minio 会存在脏数据情况，暂时不处理
        if (formData.value.id !== undefined) {
          setCustomFieldApi({
            id: formData.value.id,
            field: fieldUid,
            data: fileList
          }).catch(() => {
            ElMessage.error("上传失败")
          })
        }
      })
      .catch(() => {
        ElMessage.error("上传失败")
      })
  })
}

const createHandleRemove = (field: string) => {
  const handleRemove: UploadProps["onRemove"] = (file) => {
    if (file.url === undefined) {
      return
    }

    removeMinioObject(decodedUrlPath(file.url)).then(() => {
      formData.value.data[field] = formData.value.data[field].map((item: UploadUserFile) =>
        item.name === file.name ? { ...item } : item
      )

      setCustomFieldApi({
        id: formData.value.id as number,
        field: field,
        data: formData.value.data[field]
      }).catch(() => {
        ElMessage.error("上传失败")
      })
    })
  }

  return handleRemove
}

const handleProgress = (event: UploadProgressEvent, file: UploadUserFile) => {
  file.percentage = event.percent
}

const handlePreview: UploadProps["onPreview"] = (uploadFile) => {
  console.log(uploadFile)
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

const nonFileFields = computed(() => {
  return props.attributeFiledsData.filter((item) => item.field_type !== "file" && item.field_type !== "multiline")
})

const fileFields = computed(() => {
  return props.attributeFiledsData.filter((item) => item.field_type === "file")
})

const multilineFields = computed(() => {
  return props.attributeFiledsData.filter((item) => item.field_type === "multiline")
})

/** 新增关联类型 */
const handleSubmit = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? createResourceApi : updateResourceApi
    api(formData.value)
      .then(() => {
        ElMessage.success("操作成功")
        onClosed()
        emits("list")
      })
      .finally(() => {})
  })
}

const setForm = (row: Resource) => {
  formData.value = cloneDeep(row)
}

const onClosed = () => {
  emits("closed")
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

defineExpose({
  handleSubmit,
  setForm,
  resetForm
})
</script>

<style lang="scss" scoped>
.form-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.resource-form {
  .form-section {
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 16px;
      font-weight: 600;
      color: #374151;

      .section-icon {
        color: #3b82f6;
        font-size: 18px;
      }
    }

    .form-row {
      margin-bottom: 20px;

      .form-item {
        margin-bottom: 0;

        :deep(.el-form-item__label) {
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
          font-size: 14px;
        }

        :deep(.el-input) {
          .el-input__wrapper {
            border-radius: 6px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            border: 1px solid #d1d5db;
            transition: all 0.2s ease;

            &:hover {
              border-color: #9ca3af;
            }

            &.is-focus {
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
          }
        }

        :deep(.el-select) {
          width: 100%;

          .el-select__wrapper {
            border-radius: 6px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            border: 1px solid #d1d5db;
            transition: all 0.2s ease;

            &:hover {
              border-color: #9ca3af;
            }

            &.is-focus {
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
          }
        }

        :deep(.el-textarea) {
          .el-textarea__inner {
            border-radius: 6px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            border: 1px solid #d1d5db;
            transition: all 0.2s ease;
            resize: vertical;

            &:hover {
              border-color: #9ca3af;
            }

            &:focus {
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
          }
        }

        .upload-wrapper {
          width: 100%;

          .upload-file {
            width: 100%;

            :deep(.el-upload) {
              width: 100%;
            }

            :deep(.el-upload-list__item) {
              transition: none !important;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
              margin-top: 8px;
            }

            :deep(.el-upload-list__item-name) {
              color: #374151;
              font-size: 14px;
            }

            :deep(.el-upload-list__item-status-label) {
              color: #10b981;
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .form-container {
    padding: 16px;
  }

  .resource-form {
    .form-section {
      .section-title {
        font-size: 15px;
        margin-bottom: 16px;
      }

      .form-row {
        margin-bottom: 16px;
      }

      // 在小屏幕上改为单列布局
      :deep(.el-col) {
        width: 100% !important;
        flex: 0 0 100% !important;
        max-width: 100% !important;
      }
    }
  }
}

// 中等屏幕优化
@media (max-width: 1024px) and (min-width: 769px) {
  .resource-form {
    .form-section {
      // 在中等屏幕上保持两列，但调整间距
      :deep(.el-row) {
        margin: 0 -10px;
      }
      
      :deep(.el-col) {
        padding: 0 10px;
      }
    }
  }
}
</style>
