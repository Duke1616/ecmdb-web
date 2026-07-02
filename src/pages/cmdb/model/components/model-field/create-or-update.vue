<template>
  <Drawer
    v-model="visible"
    :title="readonly ? '查看属性' : activeAttribute ? '编辑属性' : '新增属性'"
    subtitle="添加或编辑模型属性"
    size="35%"
    direction="rtl"
    header-icon="Edit"
    :show-footer="true"
    :show-confirm-button="!readonly"
    :cancel-button-text="readonly ? '关闭' : '取消'"
    :confirm-loading="loading"
    @cancel="visible = false"
    @confirm="handleConfirm"
    @closed="handleClosed"
  >
    <div class="field-form-container">
      <el-form
        :model="formData"
        :rules="fieldRules"
        size="large"
        label-width="auto"
        ref="formRef"
        class="field-form"
        label-position="top"
        :disabled="readonly"
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
                placeholder="请输入属性唯一标识"
                size="large"
                clearable
              />
              <div class="field-hint">以字母开头，只能包含字母、数字、下划线</div>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item label="属性名称" prop="field_name" class="form-item">
              <el-input v-model="formData.field_name" placeholder="请输入属性显示名称" size="large" clearable />
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item label="属性类型" prop="field_type" class="form-item">
              <div class="field-type-selector">
                <div
                  v-for="item in fieldTypeOptions"
                  :key="item.value"
                  :class="['field-type-card', { active: formData.field_type === item.value }]"
                  @click="!readonly && selectFieldType(item.value)"
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

        <div v-if="isListField" class="form-section">
          <div class="section-title">
            <el-icon class="section-icon"><Grid /></el-icon>
            <span>列表选项</span>
          </div>
          <div class="form-row">
            <div class="list-options">
              <VueDraggable
                v-model="optionRows"
                :animation="150"
                itemKey="id"
                ghostClass="ghost-item"
                chosenClass="chosen-item"
                handle=".drag-handle"
                :disabled="readonly"
                class="options-container"
              >
                <div v-for="(item, index) in optionRows" :key="item.id" class="option-item">
                  <div class="option-content">
                    <el-icon v-if="!readonly" class="drag-handle">
                      <Grid />
                    </el-icon>
                    <el-input
                      v-model="item.name"
                      @change="syncOptionsToForm"
                      placeholder="请输入选项值"
                      class="option-input"
                    />
                    <div v-if="!readonly" class="option-actions">
                      <el-button
                        v-if="optionRows.length > 1"
                        type="danger"
                        text
                        :icon="Minus"
                        @click="removeOption(index)"
                        class="remove-option-btn"
                      />
                      <el-button type="primary" text :icon="Plus" @click="addOption" class="add-option-btn" />
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
            <span>属性设置</span>
          </div>
          <div class="form-row">
            <div class="settings-grid">
              <div v-if="availableSettings.includes('required')" class="setting-item">
                <el-form-item prop="required">
                  <div class="setting-card is-required" :class="{ active: formData.required }">
                    <div class="setting-icon">
                      <el-icon><StarFilled /></el-icon>
                    </div>
                    <div class="setting-content">
                      <div class="setting-title">是否必填</div>
                      <div class="setting-desc">资源录入时必须填写</div>
                    </div>
                    <el-switch v-model="formData.required" active-color="#ef4444" inactive-color="var(--border)" />
                  </div>
                </el-form-item>
              </div>

              <div v-if="availableSettings.includes('secure')" class="setting-item">
                <el-form-item prop="secure">
                  <div class="setting-card is-secure" :class="{ active: formData.secure }">
                    <div class="setting-icon">
                      <el-icon><Lock /></el-icon>
                    </div>
                    <div class="setting-content">
                      <div class="setting-title">加密属性</div>
                      <div class="setting-desc">敏感内容需授权查看</div>
                    </div>
                    <el-switch v-model="formData.secure" active-color="#f97316" inactive-color="var(--border)" />
                  </div>
                </el-form-item>
              </div>

              <div v-if="availableSettings.includes('link')" class="setting-item">
                <el-form-item prop="link">
                  <div class="setting-card is-link" :class="{ active: formData.link }">
                    <div class="setting-icon">
                      <el-icon><Link /></el-icon>
                    </div>
                    <div class="setting-content">
                      <div class="setting-title">是否外链</div>
                      <div class="setting-desc">展示为可跳转链接</div>
                    </div>
                    <el-switch v-model="formData.link" active-color="#2563eb" inactive-color="var(--border)" />
                  </div>
                </el-form-item>
              </div>
            </div>
          </div>
        </div>
      </el-form>
    </div>
  </Drawer>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { Grid, Link, Lock, Minus, Plus, Setting, StarFilled } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import { useAttributeForm } from "../../composables/useAttributeForm"
import type { Attribute } from "@/api/cmdb/attribute/types/attribute"

// 接收父组件传递
interface Props {
  modelUid: string
  groupId: number | undefined
  activeAttribute: Attribute | null // 声明式：当前编辑的属性行，若为 null 则是新增
  readonly?: boolean
}

const props = defineProps<Props>()
const emits = defineEmits<{
  success: []
}>()

const visible = defineModel<boolean>({ default: false })

const loading = ref(false)

const {
  FIELD_TYPE_OPTIONS: fieldTypeOptions,
  formRef,
  formData,
  fieldRules,
  optionRows,
  availableSettings,
  isListField,
  selectFieldType,
  addOption,
  removeOption,
  syncOptionsToForm,
  resetForm,
  setFrom,
  handlerCreateOrUpdateAttribute
} = useAttributeForm(props, () => emits("success"))

const handleConfirm = async () => {
  loading.value = true
  const success = await handlerCreateOrUpdateAttribute()
  loading.value = false
  if (success) {
    visible.value = false
  }
}

const handleClosed = () => {
  resetForm()
}

watch(
  () => visible.value,
  (opened) => {
    if (!opened) return

    if (props.activeAttribute) {
      setFrom(props.activeAttribute)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)
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
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;

    .setting-item {
      .el-form-item {
        margin-bottom: 0;

        :deep(.el-form-item__content) {
          width: 100%;
        }

        :deep(.el-switch) {
          --el-switch-off-color: #d1d5db;
          flex-shrink: 0;
        }
      }

      .setting-card {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 88px;
        padding: 14px 16px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition:
          border-color 0.2s ease,
          background 0.2s ease,
          box-shadow 0.2s ease;

        &.active {
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
        }

        &.is-required {
          .setting-icon {
            color: #dc2626;
            background: #fee2e2;
          }

          &.active {
            background: #fff7f7;
            border-color: #fca5a5;
          }
        }

        &.is-secure {
          .setting-icon {
            color: #ea580c;
            background: #ffedd5;
          }

          &.active {
            background: #fff7ed;
            border-color: #fdba74;
          }
        }

        &.is-link {
          .setting-icon {
            color: #2563eb;
            background: #dbeafe;
          }

          &.active {
            background: #eff6ff;
            border-color: #93c5fd;
          }
        }
      }

      .setting-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        font-size: 18px;
        flex-shrink: 0;
      }

      .setting-content {
        flex: 1;
        min-width: 0;
      }

      .setting-title {
        color: #111827;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.35;
      }

      .setting-desc {
        margin-top: 3px;
        color: #64748b;
        font-size: 12px;
        line-height: 1.4;
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
