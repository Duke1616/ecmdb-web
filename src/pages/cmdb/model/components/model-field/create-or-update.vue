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
                <el-tooltip
                  v-for="item in fieldTypeOptions"
                  :key="item.value"
                  :content="item.description"
                  placement="top"
                  :show-after="250"
                >
                  <div
                    :class="['field-type-card', { active: formData.field_type === item.value }]"
                    @click="!readonly && selectFieldType(item.value)"
                  >
                    <div class="card-icon" :style="{ color: item.color, backgroundColor: item.bgColor }">
                      <el-icon><component :is="item.icon" /></el-icon>
                    </div>
                    <span class="card-title">{{ item.label }}</span>
                    <el-icon v-if="formData.field_type === item.value" class="check-icon"><Check /></el-icon>
                  </div>
                </el-tooltip>
              </div>
            </el-form-item>
          </div>
        </div>

        <div v-if="isListField" class="form-section">
          <div class="section-title">
            <div class="section-title-left">
              <el-icon class="section-icon"><Grid /></el-icon>
              <span>列表选项</span>
            </div>
            <span class="section-badge">共 {{ optionRows.length }} 项</span>
          </div>
          <div class="form-row">
            <div class="list-options-panel">
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
                <div v-for="(item, index) in optionRows" :key="item.id" class="option-row">
                  <el-icon v-if="!readonly" class="drag-handle" title="按住拖拽调整顺序">
                    <Rank />
                  </el-icon>
                  <span class="option-index">{{ index + 1 }}</span>
                  <el-input
                    :ref="(el) => setOptionInputRef(el, item.id)"
                    v-model="item.name"
                    @change="syncOptionsToForm"
                    @keydown.enter.prevent="handleOptionEnter(index)"
                    placeholder="输入选项名称，按 Enter 添加下一项"
                    class="option-input"
                    :disabled="readonly"
                  />
                  <el-tooltip
                    v-if="!readonly && optionRows.length > 1"
                    content="删除选项"
                    placement="top"
                    :show-after="300"
                  >
                    <el-button
                      type="danger"
                      text
                      circle
                      size="small"
                      :icon="Delete"
                      @click="removeOption(index)"
                      class="remove-option-btn"
                    />
                  </el-tooltip>
                </div>
              </VueDraggable>

              <div v-if="!readonly" class="add-option-trigger" @click="handleAddOption">
                <el-icon class="add-icon"><Plus /></el-icon>
                <span class="add-text">添加选项</span>
                <span class="add-tip">（或在上方输入框按 Enter）</span>
              </div>
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
                    <el-switch
                      v-model="formData.required"
                      size="default"
                      active-color="#ef4444"
                      inactive-color="var(--border)"
                    />
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
                    <el-switch
                      v-model="formData.secure"
                      size="default"
                      active-color="#f97316"
                      inactive-color="var(--border)"
                    />
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
                    <el-switch
                      v-model="formData.link"
                      size="default"
                      active-color="#2563eb"
                      inactive-color="var(--border)"
                    />
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
import { nextTick, ref, watch } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { Check, Delete, Grid, Link, Lock, Plus, Rank, Setting, StarFilled } from "@element-plus/icons-vue"
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

// 选项输入框引用与快捷操作
const optionInputRefs = ref<Record<string, any>>({})
const setOptionInputRef = (el: any, id: string) => {
  if (el) {
    optionInputRefs.value[id] = el
  } else {
    delete optionInputRefs.value[id]
  }
}

const handleOptionEnter = (index: number) => {
  if (props.readonly) return
  const newId = addOption(index)
  nextTick(() => {
    const comp = optionInputRefs.value[newId]
    comp?.focus?.()
  })
}

const handleAddOption = () => {
  if (props.readonly) return
  const newId = addOption()
  nextTick(() => {
    const comp = optionInputRefs.value[newId]
    comp?.focus?.()
  })
}

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
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;

    .section-title-left {
      display: flex;
      align-items: center;
    }

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

    .section-badge {
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      background: #e2e8f0;
      padding: 1px 8px;
      border-radius: 10px;
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
    margin-top: 6px;
    width: 100%;

    @media (max-width: 520px) {
      grid-template-columns: repeat(3, 1fr);
    }

    .field-type-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      height: 40px;
      padding: 0 10px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-width: 0;
      user-select: none;

      &:hover {
        border-color: #93c5fd;
        background: #f8fafc;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);

        .card-icon {
          transform: scale(1.08);
        }
      }

      &.active {
        border-color: #3b82f6;
        background: #eff6ff;
        box-shadow:
          0 0 0 1px #3b82f6,
          0 2px 8px rgba(59, 130, 246, 0.12);

        .card-title {
          color: #1d4ed8;
          font-weight: 600;
        }
      }

      .card-icon {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: transform 0.2s ease;
        flex-shrink: 0;
      }

      .card-title {
        flex: 1;
        min-width: 0;
        font-size: 13px;
        font-weight: 500;
        color: #374151;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.2s ease;
      }

      .check-icon {
        font-size: 13px;
        color: #2563eb;
        flex-shrink: 0;
        margin-left: auto;
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
        min-height: 52px;
        padding: 8px 14px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition:
          border-color 0.2s ease,
          background 0.2s ease,
          box-shadow 0.2s ease;

        &.active {
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
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
        width: 32px;
        height: 32px;
        border-radius: 6px;
        font-size: 16px;
        flex-shrink: 0;
      }

      .setting-content {
        flex: 1;
        min-width: 0;
      }

      .setting-title {
        color: #111827;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.3;
      }

      .setting-desc {
        margin-top: 2px;
        color: #64748b;
        font-size: 12px;
        line-height: 1.35;
      }
    }
  }

  .list-options-panel {
    width: 100%;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    transition: border-color 0.2s ease;

    &:hover {
      border-color: #cbd5e1;
    }

    .options-container {
      display: flex;
      flex-direction: column;
      width: 100%;

      .option-row {
        display: flex;
        align-items: center;
        padding: 0 10px 0 12px;
        height: 40px;
        background: #ffffff;
        border-bottom: 1px solid #f1f5f9;
        transition: all 0.15s ease;
        gap: 8px;

        &:hover {
          background: #f8fafc;

          .drag-handle {
            color: #3b82f6;
          }

          .remove-option-btn {
            opacity: 1;
          }
        }

        &:focus-within {
          background: #f8fafc;
        }

        .drag-handle {
          color: #94a3b8;
          cursor: grab;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
          flex-shrink: 0;

          &:active {
            cursor: grabbing;
          }
        }

        .option-index {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          min-width: 16px;
          text-align: center;
          user-select: none;
          flex-shrink: 0;
        }

        .option-input {
          flex: 1;

          :deep(.el-input__wrapper) {
            border: none;
            box-shadow: none;
            background: transparent;
            padding: 0 4px;
            height: 32px;

            &.is-focus {
              box-shadow: none;
            }

            .el-input__inner {
              font-size: 13px;
              color: #1e293b;

              &::placeholder {
                color: #94a3b8;
                font-size: 12px;
              }
            }
          }
        }

        .remove-option-btn {
          opacity: 0.6;
          color: #94a3b8;
          transition: all 0.15s ease;
          flex-shrink: 0;

          &:hover {
            opacity: 1;
            color: #ef4444;
            background: #fef2f2;
          }
        }
      }

      .ghost-item {
        opacity: 0.35;
        background: #eff6ff;
      }

      .chosen-item {
        background: #f1f5f9;
      }
    }

    .add-option-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 38px;
      gap: 6px;
      background: #fafafa;
      color: #64748b;
      font-size: 13px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;

      .add-icon {
        font-size: 14px;
      }

      .add-tip {
        font-size: 12px;
        color: #94a3b8;
      }

      &:hover {
        background: #eff6ff;
        color: #2563eb;

        .add-tip {
          color: #60a5fa;
        }
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
