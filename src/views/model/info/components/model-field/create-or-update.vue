<template>
  <div class="field-form-container">
    <el-form
      :model="formData"
      :rules="fieldRules"
      size="large"
      label-width="auto"
      ref="formRef"
      class="field-form"
      label-position="top"
    >
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>
        <div class="form-row">
          <el-form-item label="唯一标识" prop="field_uid" class="form-item">
            <el-input
              v-model="formData.field_uid"
              :disabled="formData.id !== undefined"
              placeholder="请输入字段唯一标识"
              size="large"
              clearable
            />
            <div class="field-hint">以字母开头，只能包含字母、数字、下划线</div>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="字段名称" prop="field_name" class="form-item">
            <el-input v-model="formData.field_name" placeholder="请输入字段显示名称" size="large" clearable />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="字段类型" prop="field_type" class="form-item">
            <div class="field-type-selector">
              <div
                v-for="item in fieldTypeOptions"
                :key="item.value"
                :class="['field-type-card', { active: formData.field_type === item.value }]"
                @click="selectFieldType(item.value)"
              >
                <div class="card-icon">
                  <el-icon><component :is="item.icon" /></el-icon>
                </div>
                <div class="card-content">
                  <div class="card-title">{{ item.label }}</div>
                  <div class="card-description">{{ item.description }}</div>
                </div>
              </div>
            </div>
          </el-form-item>
        </div>
      </div>

      <div v-if="formData.field_type == 'list'" class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Grid /></el-icon>
          <span>列表选项</span>
        </div>
        <div class="form-row">
          <div class="list-options">
            <VueDraggable
              v-model="list"
              :animation="150"
              itemKey="id"
              ghostClass="ghost-item"
              chosenClass="chosen-item"
              handle=".drag-handle"
              class="options-container"
            >
              <div v-for="(item, index) in list" :key="item.id" class="option-item">
                <div class="option-content">
                  <el-icon class="drag-handle">
                    <Grid />
                  </el-icon>
                  <el-input
                    v-model="item.name"
                    @change="changeText(index)"
                    placeholder="请输入选项值"
                    class="option-input"
                  />
                  <div class="option-actions">
                    <el-button
                      v-if="list.length > 1"
                      type="danger"
                      text
                      :icon="Minus"
                      @click="removeList(index)"
                      class="remove-option-btn"
                    />
                    <el-button type="primary" text :icon="Plus" @click="handlerAdd" class="add-option-btn" />
                  </div>
                </div>
              </div>
            </VueDraggable>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>字段设置</span>
        </div>
        <div class="form-row">
          <div class="settings-grid">
            <div v-if="availableSettings.includes('required')" class="setting-item">
              <el-form-item label="是否必填" prop="required">
                <el-switch v-model="formData.required" active-color="var(--primary)" inactive-color="var(--border)" />
              </el-form-item>
            </div>

            <div v-if="availableSettings.includes('secure')" class="setting-item">
              <el-form-item label="加密属性" prop="secure">
                <el-switch v-model="formData.secure" active-color="var(--primary)" inactive-color="var(--border)" />
              </el-form-item>
            </div>

            <div v-if="availableSettings.includes('link')" class="setting-item">
              <el-form-item label="是否外链" prop="link">
                <el-switch v-model="formData.link" active-color="var(--primary)" inactive-color="var(--border)" />
              </el-form-item>
            </div>
          </div>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { CreateAttributeApi, UpdateAttributeApi } from "@/api/attribute"
import { Attribute, type createOrUpdateAttributeReq } from "@/api/attribute/types/attribute"
import { cloneDeep } from "lodash-es"
import { ElMessage, ElMessageBox, FormInstance, FormRules } from "element-plus"
import { Setting } from "@element-plus/icons-vue"
import { v4 as uuidv4 } from "uuid"
import { Minus, Plus, Grid } from "@element-plus/icons-vue"

// 接收父组建传递
interface Props {
  modelUid: string
  groupId: number | undefined
}

const props = defineProps<Props>()
const emits = defineEmits(["close", "getAttributesData"])
const fieldTypeOptions = [
  {
    value: "string",
    label: "字符串",
    description: "单行文本输入",
    icon: "Document"
  },
  {
    value: "multiline",
    label: "多行文本",
    description: "多行文本输入",
    icon: "Edit"
  },
  {
    value: "list",
    label: "列表",
    description: "下拉选择列表",
    icon: "List"
  },
  {
    value: "file",
    label: "文件",
    description: "文件上传",
    icon: "Folder"
  }
]

const list = ref([
  {
    name: "",
    id: uuidv4()
  }
])

function removeList(index: number) {
  list.value.splice(index, 1)
  formData.value.option = list.value.map((item) => item.name).filter((name) => name)
}

function handlerAdd() {
  list.value.push({
    name: "",
    id: uuidv4()
  })
}

const changeText = (index: number) => {
  if (!Array.isArray(formData.value.option)) {
    formData.value.option = []
  }
  formData.value.option.push(list.value[index].name)
}

// 获取字段类型对应的可用设置项
const getAvailableSettings = (fieldType: string) => {
  const settingsMap = {
    string: ["required", "secure", "link"],
    multiline: ["required", "secure"],
    list: ["required"],
    file: ["required"]
  }
  return settingsMap[fieldType as keyof typeof settingsMap] || []
}

// 重置不相关的设置项
const resetUnrelatedSettings = (fieldType: string) => {
  const availableSettings = getAvailableSettings(fieldType)

  if (!availableSettings.includes("secure")) {
    formData.value.secure = false
  }
  if (!availableSettings.includes("link")) {
    formData.value.link = false
  }
}

const selectFieldType = (fieldType: string) => {
  formData.value.field_type = fieldType
  resetUnrelatedSettings(fieldType)
}

// 当前可用的设置项
const availableSettings = computed(() => {
  return getAvailableSettings(formData.value.field_type)
})

const DEFAULT_FORM_DATA: createOrUpdateAttributeReq = {
  model_uid: props.modelUid,
  group_id: props.groupId ?? 0,
  field_uid: "",
  field_name: "",
  field_type: "string",
  required: false,
  link: false,
  secure: false,
  option: ""
}

const formData = ref<createOrUpdateAttributeReq>(cloneDeep(DEFAULT_FORM_DATA))
const originalFormData = ref<createOrUpdateAttributeReq | null>(null)
const formRef = ref<FormInstance | null>(null)
const fieldRules: FormRules = {
  field_uid: [
    { required: true, message: "必须输入字段唯一标识", trigger: "blur" },
    {
      type: "string",
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: "名称以字母开头，只能包含字母、数字、下划线",
      trigger: "blur"
    }
  ],
  field_name: [{ required: true, message: "必须输入字段名称", trigger: "blur" }]
}

/** 检测安全字段是否被修改 */
const hasSecureFieldChanges = () => {
  if (!originalFormData.value) return false

  // 检查 secure 字段是否被修改
  return formData.value.secure !== originalFormData.value.secure
}

/** 显示安全字段修改确认弹窗 */
const showSecureFieldWarning = () => {
  return ElMessageBox.confirm(
    "检测到您修改了字段的加密属性，这会影响该字段在资源管理中的显示和存储方式。\n\n请确认是否继续保存？",
    "字段加密属性修改提醒",
    {
      confirmButtonText: "确认保存",
      cancelButtonText: "取消",
      type: "warning",
      dangerouslyUseHTMLString: false,
      customClass: "secure-field-warning-dialog"
    }
  )
}

const handlerCreateOrUpdateAttribute = async () => {
  try {
    // 表单验证
    const isValid = await new Promise<boolean>((resolve) => {
      formRef.value?.validate((valid: boolean) => {
        resolve(valid)
      })
    })

    if (!isValid) {
      ElMessage.error("表单校验不通过，请检查必填项")
      return false
    }

    const isEdit = formData.value.id !== undefined

    // 如果是修改模式且包含安全字段修改，显示确认弹窗
    if (isEdit && hasSecureFieldChanges()) {
      try {
        await showSecureFieldWarning()
      } catch {
        // 用户取消操作
        return false
      }
    }

    // 调用 API
    const api = isEdit ? UpdateAttributeApi : CreateAttributeApi
    await api(formData.value)

    ElMessage.success("保存成功")
    emits("getAttributesData")
    return true
  } catch (error) {
    console.error("保存失败:", error)

    return false
  }
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  originalFormData.value = null // 清空原始数据
}

const setFrom = (row: Attribute) => {
  formData.value = cloneDeep(row)
  originalFormData.value = cloneDeep(row) // 保存原始数据用于比较
  if (!Array.isArray(row.option)) return

  list.value = []
  row.option?.forEach((item: string) => {
    list.value.push({
      name: item,
      id: uuidv4()
    })
  })
}

defineExpose({
  setFrom,
  resetForm,
  handlerCreateOrUpdateAttribute
})
</script>

<style lang="scss" scoped>
.field-form-container {
  padding: 20px;
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  overflow-y: auto;
}

.field-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;

    .section-icon {
      margin-right: 6px;
      font-size: 16px;
      color: #3b82f6;
    }

    span {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  }

  .form-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
      font-size: 13px;
    }

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-select__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    .field-hint {
      font-size: 11px;
      color: #6b7280;
      margin-top: 3px;
    }
  }

  .field-type-selector {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 8px;
    width: 100%;

    .field-type-card {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      width: 100%;
      min-width: 0;

      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        transform: translateY(-2px);
      }

      &.active {
        border-color: #3b82f6;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);

        .card-icon {
          background: #3b82f6;
          color: #ffffff;
        }

        .card-title {
          color: #1e40af;
          font-weight: 600;
        }
      }

      .card-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: #f3f4f6;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .card-content {
        flex: 1;
        min-width: 0;
        width: 100%;

        .card-title {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 2px;
          transition: all 0.2s ease;
          word-break: break-word;
        }

        .card-description {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.3;
          word-break: break-word;
        }
      }
    }
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;

    .setting-item {
      background: #f9fafb;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;

      .el-form-item {
        margin-bottom: 0;

        :deep(.el-form-item__content) {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        :deep(.el-switch) {
          --el-switch-on-color: #3b82f6;
          --el-switch-off-color: #d1d5db;
        }
      }
    }
  }

  .list-options {
    .options-container {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .option-item {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 8px;
        transition: all 0.2s ease;

        &:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .option-content {
          display: flex;
          align-items: center;
          gap: 8px;

          .drag-handle {
            color: #9ca3af;
            cursor: grab;
            font-size: 14px;

            &:active {
              cursor: grabbing;
            }
          }

          .option-input {
            flex: 1;

            :deep(.el-input__wrapper) {
              border: none;
              box-shadow: none;
              background: transparent;
              padding: 4px 6px;

              &:hover,
              &.is-focus {
                border: 1px solid #3b82f6;
                box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.1);
                background: #ffffff;
              }
            }
          }

          .option-actions {
            display: flex;
            gap: 3px;

            .remove-option-btn,
            .add-option-btn {
              width: 24px;
              height: 24px;
              border-radius: 3px;
              border: 1px solid #e5e7eb;

              &.remove-option-btn:hover {
                background: #ef4444;
                color: #ffffff;
                border-color: #ef4444;
              }

              &.add-option-btn:hover {
                background: #3b82f6;
                color: #ffffff;
                border-color: #3b82f6;
              }
            }
          }
        }
      }

      .ghost-item {
        opacity: 0.3;
        background: #3b82f6;
      }

      .chosen-item {
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
      }
    }
  }
}

// 安全字段警告弹窗样式
:deep(.secure-field-warning-dialog) {
  .el-message-box__title {
    color: #e6a23c;
    font-weight: 600;
  }

  .el-message-box__content {
    color: #606266;
    line-height: 1.6;
  }

  .el-message-box__btns {
    .el-button--primary {
      background-color: #e6a23c;
      border-color: #e6a23c;

      &:hover {
        background-color: #d4a574;
        border-color: #d4a574;
      }
    }
  }
}
</style>
