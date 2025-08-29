<template>
  <div class="field-form-container">
    <div class="form-header">
      <h3>{{ formData.id ? "编辑字段" : "新增字段" }}</h3>
      <p>配置字段的基本信息和属性设置</p>
    </div>

    <el-form
      :model="formData"
      :rules="fieldRules"
      size="large"
      label-width="auto"
      ref="formRef"
      class="modern-form"
      label-position="top"
    >
      <div class="form-section">
        <h4 class="section-title">基本信息</h4>
        <el-form-item label="唯一标识" prop="field_uid">
          <el-input
            v-model="formData.field_uid"
            :disabled="formData.id !== undefined"
            placeholder="请输入字段唯一标识"
            class="form-input"
          />
          <div class="field-hint">以字母开头，只能包含字母、数字、下划线</div>
        </el-form-item>

        <el-form-item label="字段名称" prop="field_name">
          <el-input v-model="formData.field_name" placeholder="请输入字段显示名称" class="form-input" />
        </el-form-item>

        <el-form-item label="字段类型" prop="field_type">
          <el-select v-model="formData.field_type" placeholder="请选择字段类型" class="form-select">
            <el-option v-for="item in mapping" :key="item.label" :label="item.label" :value="item.value">
              <div class="option-content">
                <span class="option-label">{{ item.label }}</span>
                <span class="option-value">{{ item.value }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </div>

      <div v-if="formData.field_type == 'list'" class="form-section">
        <h4 class="section-title">列表选项</h4>
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

      <div class="form-section">
        <h4 class="section-title">字段设置</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <el-form-item label="是否必填" prop="required">
              <el-switch v-model="formData.required" active-color="var(--primary)" inactive-color="var(--border)" />
            </el-form-item>
          </div>

          <div class="setting-item">
            <el-form-item label="加密属性" prop="secure">
              <el-switch v-model="formData.secure" active-color="var(--primary)" inactive-color="var(--border)" />
            </el-form-item>
          </div>

          <div class="setting-item">
            <el-form-item label="是否外链" prop="link">
              <el-switch v-model="formData.link" active-color="var(--primary)" inactive-color="var(--border)" />
            </el-form-item>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <el-button @click="onClosed()" class="cancel-btn">取消</el-button>
        <el-button type="primary" @click="handlerCreateOrUpdateAttribute()" class="save-btn">
          {{ formData.id ? "更新字段" : "创建字段" }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { CreateAttributeApi, UpdateAttributeApi } from "@/api/attribute"
import { Attribute, type createOrUpdateAttributeReq } from "@/api/attribute/types/attribute"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { v4 as uuidv4 } from "uuid"
import { Minus, Plus, Grid } from "@element-plus/icons-vue"

// 接收父组建传递
interface Props {
  modelUid: string
  groupId: number | undefined
}

const props = defineProps<Props>()
const emits = defineEmits(["close", "getAttributesData"])
const onClosed = () => {
  resetForm()
  list.value = cloneDeep([
    {
      name: "",
      id: uuidv4()
    }
  ])
  emits("close", false)
}

const mapping = [
  {
    value: "string",
    label: "字符串"
  },
  {
    value: "multiline",
    label: "多行文本"
  },
  {
    value: "list",
    label: "列表"
  },
  {
    value: "file",
    label: "文件"
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

const handlerCreateOrUpdateAttribute = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? CreateAttributeApi : UpdateAttributeApi
    api(formData.value)
      .then(() => {
        ElMessage.success("保存成功")
        onClosed()
        emits("getAttributesData")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

const setFrom = (row: Attribute) => {
  formData.value = cloneDeep(row)
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
  resetForm
})
</script>

<style lang="scss" scoped>
.field-form-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;

  .form-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
    }

    p {
      color: #6b7280;
      margin: 0;
      font-size: 13px;
      line-height: 1.4;
    }
  }

  .modern-form {
    flex: 1;
    display: flex;
    flex-direction: column;

    .form-section {
      margin-bottom: 18px;

      .section-title {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 12px 0;
        padding-bottom: 4px;
        border-bottom: 1px solid #e5e7eb;
      }

      .el-form-item {
        margin-bottom: 12px;

        :deep(.el-form-item__label) {
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
          font-size: 13px;
        }

        .form-input,
        .form-select {
          :deep(.el-input__wrapper),
          :deep(.el-select__wrapper) {
            border-radius: 4px;
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            background: #ffffff;

            &:hover {
              border-color: #3b82f6;
            }

            &.is-focus {
              border-color: #3b82f6;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
            }
          }
        }

        .field-hint {
          font-size: 11px;
          color: #6b7280;
          margin-top: 3px;
        }
      }

      .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;

        .setting-item {
          background: #f9fafb;
          padding: 10px;
          border-radius: 4px;
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
            border-radius: 4px;
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

    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      margin-top: auto;

      .cancel-btn {
        background: #f9fafb;
        color: #6b7280;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 8px 16px;
        font-weight: 500;

        &:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
      }

      .save-btn {
        background: #3b82f6;
        border-color: #3b82f6;
        border-radius: 4px;
        padding: 8px 16px;
        font-weight: 600;
        color: #ffffff;

        &:hover {
          background: #2563eb;
          border-color: #2563eb;
        }
      }
    }
  }
}

:deep(.option-content .el-select) {
  .option-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .option-label {
      font-weight: 500;
      color: #1f2937;
    }

    .option-value {
      font-size: 12px;
      color: #6b7280;
      font-family: "Monaco", "Menlo", monospace;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
    }
  }
}
</style>
