<template>
  <div class="form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      size="default"
      label-position="top"
      class="resource-form"
    >
      <!-- 按分组展示字段 -->
      <div v-for="group in props.attributeGroupsData" :key="group.group_id" class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>{{ group.group_name }}</span>
          <el-tag size="small" type="info">{{ group.attributes?.length || 0 }} 个字段</el-tag>
        </div>

        <!-- 字符串和列表字段 - 两列布局 -->
        <el-row :gutter="16">
          <el-col :span="12" v-for="(item, index) of getNonFileFields(group.attributes || [])" :key="index">
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
                  <el-select v-model="formData.data[item.field_uid]" placeholder="请选择" clearable>
                    <el-option v-for="option in item.option" :key="option" :label="option" :value="option" />
                  </el-select>
                </template>
              </el-form-item>
            </div>
          </el-col>
        </el-row>

        <!-- 多行文本字段 - 独占一行 -->
        <el-row :gutter="16">
          <el-col :span="24" v-for="(item, index) of getMultilineFields(group.attributes || [])" :key="index">
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

        <!-- 文件上传字段 - 独占一行 -->
        <el-row :gutter="16">
          <el-col :span="24" v-for="(item, index) of getFileFields(group.attributes || [])" :key="index">
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
                    drag
                  >
                    <div class="upload-dragger">
                      <el-icon class="upload-icon"><Upload /></el-icon>
                      <div class="upload-text">
                        <p class="upload-title">点击或拖拽文件到此处上传</p>
                        <p class="upload-hint">支持多文件上传，最多5个文件</p>
                      </div>
                    </div>
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
  attributeGroupsData: any[] // 分组数据
}

const props = defineProps<Props>()
const emits = defineEmits(["list", "closed"])
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

// 按分组过滤字段的方法
const getNonFileFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type !== "file" && item.field_type !== "multiline")
}

const getFileFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type === "file")
}

const getMultilineFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type === "multiline")
}

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
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.resource-form {
  .form-section {
    margin-bottom: 20px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 15px;
      font-weight: 600;
      color: #374151;

      .section-icon {
        color: #3b82f6;
        font-size: 16px;
      }
    }

    .form-row {
      margin-bottom: 16px;

      .form-item {
        margin-bottom: 0;

        :deep(.el-form-item__label) {
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
          font-size: 13px;
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
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .form-container {
    padding: 12px;
  }

  .resource-form {
    .form-section {
      .section-title {
        font-size: 14px;
        margin-bottom: 12px;
      }

      .form-row {
        margin-bottom: 12px;
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
