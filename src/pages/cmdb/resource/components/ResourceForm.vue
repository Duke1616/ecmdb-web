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
              <el-form-item
                :prop="'data.' + item.field_uid"
                :label="item.field_name"
                :class="['form-item', { 'secure-field': item.secure }]"
              >
                <template v-if="item.field_type === 'string'">
                  <el-input
                    v-if="!item.secure"
                    v-model="formData.data[item.field_uid]"
                    :placeholder="handlerPlaceholder(item.field_name)"
                    clearable
                  />
                  <el-input
                    v-else
                    v-model="formData.data[item.field_uid]"
                    :placeholder="isEditMode ? '不修改则保留原值' : handlerPlaceholder(item.field_name)"
                    type="password"
                    show-password
                    clearable
                    class="secure-input"
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

        <!-- 多行文本字段 - 非加密，独占一行 -->
        <el-row :gutter="16">
          <el-col :span="24" v-for="(item, index) of getNonSecureMultilineFields(group.attributes || [])" :key="index">
            <div class="form-row">
              <el-form-item
                :prop="'data.' + item.field_uid"
                :label="item.field_name"
                :class="['form-item', { 'secure-field': item.secure }]"
              >
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

        <!-- 多行文本字段 - 加密，独占一行 -->
        <el-row :gutter="16" v-if="getSecureMultilineFields(group.attributes || []).length > 0">
          <el-col :span="24" v-for="(item, index) of getSecureMultilineFields(group.attributes || [])" :key="index">
            <div class="form-row">
              <el-form-item
                :prop="'data.' + item.field_uid"
                :label="item.field_name"
                :class="['form-item', { 'secure-field': item.secure }]"
              >
                <div class="secure-textarea-wrapper" :class="{ 'is-visible': showPassword[item.field_uid] }">
                  <div class="secure-textarea-input">
                    <el-input
                      :model-value="
                        showPassword[item.field_uid]
                          ? formData.data[item.field_uid]
                          : '•'.repeat(formData.data[item.field_uid]?.length || 0)
                      "
                      @input="handleSecureTextareaInput(item.field_uid, $event)"
                      :autosize="{ minRows: 2, maxRows: 4 }"
                      type="textarea"
                      :placeholder="isEditMode ? '不修改则保留原值' : handlerPlaceholder(item.field_name)"
                      class="secure-textarea"
                    />
                  </div>
                  <div class="secure-textarea-actions">
                    <button class="password-toggle" type="button" @click="togglePassword(item.field_uid)">
                      <el-icon>
                        <View v-if="!showPassword[item.field_uid]" />
                        <Hide v-else />
                      </el-icon>
                    </button>
                  </div>
                </div>
              </el-form-item>
            </div>
          </el-col>
        </el-row>

        <!-- 文件上传字段 - 独占一行 -->
        <el-row :gutter="16">
          <el-col :span="24" v-for="(item, index) of getFileFields(group.attributes || [])" :key="index">
            <div class="form-row">
              <el-form-item
                :prop="'data.' + item.field_uid"
                :label="item.field_name"
                :class="['form-item', { 'secure-field': item.secure }]"
              >
                <FileUpload
                  v-model="formData.data[item.field_uid]"
                  :field-uid="item.field_uid"
                  :resource-id="formData.id"
                  :title="`点击或拖拽文件到此处上传`"
                  :hint="`支持多文件上传，最多5个文件`"
                  :limit="5"
                  @upload-success="handleUploadSuccess"
                  @upload-error="handleUploadError"
                  @remove-success="handleRemoveSuccess"
                  @remove-error="handleRemoveError"
                />
              </el-form-item>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue"
import { Setting, View, Hide } from "@element-plus/icons-vue"
import FileUpload from "./ResourceFileUpload.vue"
import { createResourceApi, updateResourceApi } from "@/api/resource"
import { Resource, type CreateOrUpdateResourceReq } from "@/api/resource/types/resource"
import { cloneDeep } from "lodash-es"
import { type FormInstance, type FormRules, ElMessage, UploadUserFile } from "element-plus"
import { type Attribute } from "@/api/attribute/types/attribute"
import type { AttributeGroupView } from "@/common/utils/attribute"

// 接收父组建传递
interface Props {
  modelUid: string
  attributeFiledsData: Attribute[]
  attributeGroupsData: AttributeGroupView[]
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

// 密码显示状态管理
const showPassword = ref<Record<string, boolean>>({})

// 是否为编辑模式
const isEditMode = ref(false)

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

// 切换密码显示状态
const togglePassword = (fieldUid: string) => {
  showPassword.value[fieldUid] = !showPassword.value[fieldUid]
}

// 处理加密多行文本输入
const handleSecureTextareaInput = (fieldUid: string, value: string) => {
  if (showPassword.value[fieldUid]) {
    // 显示模式：直接更新数据
    formData.value.data[fieldUid] = value
  } else {
    // 隐藏模式：需要特殊处理
    const currentValue = formData.value.data[fieldUid] || ""
    const currentLength = currentValue.length
    const newLength = value.length

    if (newLength > currentLength) {
      // 添加字符：从末尾添加
      const addedChars = value.slice(currentLength)
      formData.value.data[fieldUid] = currentValue + addedChars
    } else if (newLength < currentLength) {
      // 删除字符：从末尾删除
      const deleteCount = currentLength - newLength
      formData.value.data[fieldUid] = currentValue.slice(0, -deleteCount)
    } else {
      // 长度相同：可能是替换，直接更新
      formData.value.data[fieldUid] = value
    }
  }
}

// 文件上传事件处理
const handleUploadSuccess = (_file: UploadUserFile, _fieldUid: string) => {
  ElMessage.success("文件上传成功")
}

const handleUploadError = (error: any, fieldUid: string) => {
  console.error("Upload error:", error, fieldUid)
  ElMessage.error("上传失败")
}

const handleRemoveSuccess = (_file: UploadUserFile, _fieldUid: string) => {
  ElMessage.success("文件删除成功")
}

const handleRemoveError = (error: any, fieldUid: string) => {
  console.error("Remove error:", error, fieldUid)
  ElMessage.error("删除失败")
}

// 按分组过滤字段的方法
const getNonFileFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type !== "file" && item.field_type !== "multiline")
}

const getFileFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type === "file")
}

const getSecureMultilineFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type === "multiline" && item.secure)
}

const getNonSecureMultilineFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type === "multiline" && !item.secure)
}

/** 新增关联类型 */
const handleSubmit = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) {
      ElMessage.error("表单校验不通过，请检查必填项")
      return console.error("表单校验不通过", fields)
    }

    const isEdit = formData.value.id !== undefined
    const actionText = isEdit ? "修改" : "新增"

    ElMessage.info(`正在${actionText}资产，请稍候...`)

    // 确保包含 model_uid 参数
    const submitData = {
      ...formData.value,
      model_uid: props.modelUid
    }

    const api = isEdit ? updateResourceApi : createResourceApi
    api(submitData)
      .then(() => {
        ElMessage.success(`${actionText}资产成功`)
        onClosed()
        emits("list")
      })
      .catch((error) => {
        ElMessage.error(`${actionText}资产失败：${error.message || "未知错误"}`)
      })
      .finally(() => {})
  })
}

const setForm = (row: Resource) => {
  isEditMode.value = true
  formData.value = cloneDeep(row)
}

const onClosed = () => {
  emits("closed")
}

const resetForm = () => {
  isEditMode.value = false
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
          font-size: 13px;
        }

        // 安全字段标签样式
        &.secure-field {
          :deep(.el-form-item__label) {
            position: relative;

            &::after {
              content: "加密";
              display: inline-block;
              margin-left: 8px;
              padding: 2px 6px;
              background-color: #fef3cd;
              color: #b45309;
              border: 1px solid #fbbf24;
              border-radius: 4px;
              font-size: 10px;
              line-height: 1.2;
              font-weight: 500;
            }
          }
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

        .secure-textarea-wrapper {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 46px;
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #fff;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;

          &:hover {
            border-color: #9ca3af;
          }

          &:focus-within {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .secure-textarea-input {
            min-width: 0;
            border-radius: 5px 0 0 5px;
            overflow: hidden;
          }

          .secure-textarea {
            width: 100%;

            :deep(.el-textarea) {
              width: 100%;

              .el-textarea__inner {
                width: 100%;
                min-height: 76px !important;
                padding: 8px 11px;
                border: 0;
                border-radius: 0;
                background: transparent;
                box-shadow: none;
                color: #374151;
                line-height: 1.6;

                &:hover,
                &:focus {
                  border: 0;
                  box-shadow: none;
                }

                &::placeholder {
                  color: #b6bdc8;
                }
              }
            }
          }

          &:not(.is-visible) {
            .secure-textarea {
              :deep(.el-textarea__inner) {
                color: #606266;
                letter-spacing: 1px;
              }
            }
          }

          .secure-textarea-actions {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding-top: 8px;
            border-left: 1px solid #e5e7eb;
            border-radius: 0 5px 5px 0;
            background: #fff;
          }

          .password-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            padding: 0;
            border: 0;
            border-radius: 6px;
            background: transparent;
            color: #909399;
            cursor: pointer;
            transition:
              color 0.2s ease,
              background-color 0.2s ease;

            &:hover {
              background: #f3f4f6;
              color: #409eff;
            }

            &:focus-visible {
              outline: 2px solid rgba(59, 130, 246, 0.22);
              outline-offset: 2px;
            }

            .el-icon {
              font-size: 16px;
            }
          }
        }
      }
    }
  }
}
</style>
