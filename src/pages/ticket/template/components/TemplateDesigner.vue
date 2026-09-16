<template>
  <div class="designer-container">
    <div class="designer-content">
      <div class="form-card">
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div class="section-title">
              <h3>表单设计器</h3>
              <p>通过拖拽方式设计表单结构和字段配置</p>
            </div>
          </div>

          <div class="designer-wrapper">
            <fc-designer ref="designerRef" :config="config" class="form-designer" @drag="handleDesignerDrag" />
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <FormActions
      @previous="previous"
      @next="handleComplete"
      @save="handleComplete"
      @cancel="close"
      :show-next="hasBindingStep"
      :show-save="!hasBindingStep"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from "vue"
import FcDesigner from "@form-create/designer"
import FormActions from "@/common/components/FormActions/index.vue"
import { createDefaultTemplateFormData } from "../types"
import type { TemplateFormData } from "../types"
import {
  SCHEDULE_DATETIME_COMPONENT_NAME,
  createScheduleDateTimeDragRule,
  getNextScheduleGroupIndex,
  normalizeScheduleDateTimeRules
} from "../utils/scheduleDateTimeComponent"
import {
  NOTIFY_HIDDEN_STYLE_FIELD,
  createNotifyDisplayBaseRule,
  isRuleNotifyHidden,
  normalizeNotifyDisplayRules,
  syncNotifyHiddenToRules
} from "../utils/notifyDisplayComponent"

interface FormDesignerExpose {
  getJson: () => unknown
  getOptionsJson: () => unknown
  setRule: (rules: unknown) => void
  setOptions: (options: unknown) => void
  clearDragRule: () => void
  addComponent: (rule: ReturnType<typeof createScheduleDateTimeDragRule>) => void
}

const props = defineProps<{
  formData: TemplateFormData
  hasBindingStep?: boolean
}>()

const emit = defineEmits<{
  (event: "previous"): void
  (event: "next"): void
  (event: "save"): void
  (event: "close"): void
  (event: "update:formData", data: TemplateFormData): void
}>()

const designerRef = ref<FormDesignerExpose>()
const localFormData = ref<TemplateFormData>(createDefaultTemplateFormData())
let nextScheduleGroupIndex = 1
const scheduleDateTimeDragRule = createScheduleDateTimeDragRule(() => nextScheduleGroupIndex++)

const config = {
  showSaveBtn: false,
  fieldReadonly: false,
  baseRule: createNotifyDisplayBaseRule(),
  appendConfigData: (rule: any) => ({
    [NOTIFY_HIDDEN_STYLE_FIELD]: isRuleNotifyHidden(rule)
  })
}

const hasDesignerValue = (value: unknown) => {
  return value !== undefined && value !== null && value !== ""
}

const setDesignerForm = (data: Partial<TemplateFormData>) => {
  if (!designerRef.value) return

  nextScheduleGroupIndex = getNextScheduleGroupIndex(data.rules)
  designerRef.value.clearDragRule()
  designerRef.value.setOptions({})

  if (hasDesignerValue(data.options)) {
    designerRef.value.setOptions(data.options)
  }

  if (hasDesignerValue(data.rules)) {
    const normalizedRules = normalizeNotifyDisplayRules(normalizeScheduleDateTimeRules(data.rules))
    designerRef.value.setRule(normalizedRules)
  }
}

const syncDesignerToFormData = () => {
  if (designerRef.value) {
    localFormData.value.rules = syncNotifyHiddenToRules(designerRef.value.getJson())
    localFormData.value.options = designerRef.value.getOptionsJson()
    emit("update:formData", localFormData.value)
  }
}

const syncFormData = (data: TemplateFormData) => {
  localFormData.value = {
    ...createDefaultTemplateFormData(),
    ...data
  }
}

const handleComplete = () => {
  syncDesignerToFormData()
  if (props.hasBindingStep) emit("next")
  else emit("save")
}

const previous = () => {
  syncDesignerToFormData()
  emit("previous")
}

const close = () => {
  emit("close")
}

const handleDesignerDrag = (event: { item?: { name?: string } }) => {
  if (event.item?.name !== SCHEDULE_DATETIME_COMPONENT_NAME) return
  nextTick(() => {
    if (!designerRef.value) return
    // 重新交给 designer 装载，使栅格、列、日期和时间都获得各自的原生拖拽容器。
    designerRef.value.setRule(designerRef.value.getJson())
  })
}

watch(
  () => props.formData,
  (newFormData) => {
    syncFormData(newFormData)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  syncDesignerToFormData()
})

onMounted(() => {
  designerRef.value?.addComponent(scheduleDateTimeDragRule)
  setDesignerForm(props.formData)
})

defineExpose({
  setForm: (row: TemplateFormData) => {
    setDesignerForm(row)
    localFormData.value = { ...localFormData.value, ...row }
  },
  resetForm: () => {
    nextScheduleGroupIndex = 1
    designerRef.value?.clearDragRule()
    designerRef.value?.setOptions({})
  }
})
</script>

<style lang="scss" scoped>
.designer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 500px;
}

// 设计器内容
.designer-content {
  flex: 1;
  padding: 0px;
  overflow: hidden;

  .form-card {
    background: white;
    border-radius: 12px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    max-width: 100%;
    margin: 0;
    height: 100%;
  }
}

// 表单区块
.form-section {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    flex-shrink: 0;

    .section-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 16px;
        height: 16px;
        color: white;
      }
    }

    .section-title {
      h3 {
        margin: 0 0 3px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.4;
      }
    }
  }

  .designer-wrapper {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background: #fafafa;
    min-height: 0;

    // 禁用通知推送配置项 - 现代卡片式排版
    :deep(.notify-display-card-item) {
      margin-top: 14px !important;
      margin-bottom: 8px !important;
      padding: 10px 12px !important;
      background-color: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      transition: all 0.2s ease !important;

      &:hover {
        background-color: #f1f5f9 !important;
        border-color: #cbd5e1 !important;
      }

      .el-form-item__label {
        flex: 1 !important;
        margin-bottom: 0 !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        color: #1e293b !important;
        line-height: 1.4 !important;
        padding-right: 8px !important;
        display: flex !important;
        align-items: center !important;
      }

      .el-form-item__content {
        display: flex !important;
        justify-content: flex-end !important;
        line-height: normal !important;
        margin-left: 0 !important;
        flex-shrink: 0 !important;
      }

      .el-switch {
        --el-switch-on-color: #3b82f6 !important;
      }
    }
  }
}
</style>
