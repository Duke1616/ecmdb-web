<template>
  <div class="dynamic-form">
    <el-form ref="formRef" :model="localModel" label-position="top" :disabled="disabled">
      <el-row :gutter="24">
        <el-col v-for="field in schema" :key="field.key" v-show="!field.hidden" :span="getFieldSpan(field.type)">
          <div v-if="field.type === DynamicFormFieldType.Tips" class="tips-container">
            <el-alert
              :title="field.name"
              :description="getTipDescription(field)"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>

          <el-form-item
            v-else
            :label="field.name"
            :prop="field.key"
            :rules="[
              { required: field.required, message: `${field.name}不能为空`, trigger: 'blur' },
              field.validate ? { pattern: new RegExp(field.validate), message: '格式不正确', trigger: 'blur' } : {}
            ]"
          >
            <template v-if="field.readonly">
              <el-input :model-value="getDisplayValue(field.key, field.value)" readonly class="modern-input" />
            </template>

            <template v-else>
              <el-input
                v-if="field.type === DynamicFormFieldType.Input"
                :model-value="getTextValue(field.key)"
                @update:model-value="setFieldValue(field.key, $event)"
                :placeholder="field.props?.placeholder || '请输入' + field.name"
                class="modern-input"
              />

              <el-input
                v-else-if="field.type === DynamicFormFieldType.Textarea"
                :model-value="getTextValue(field.key)"
                @update:model-value="setFieldValue(field.key, $event)"
                type="textarea"
                :rows="3"
                :placeholder="field.props?.placeholder || '请输入' + field.name"
                class="modern-textarea"
              />

              <el-input-number
                v-else-if="field.type === DynamicFormFieldType.Number"
                :model-value="getNumberValue(field.key)"
                @update:model-value="setFieldValue(field.key, $event)"
                :placeholder="field.props?.placeholder"
                class="modern-input-number"
                controls-position="right"
              />

              <el-select
                v-else-if="field.type === DynamicFormFieldType.Select"
                :model-value="getSelectValue(field.key)"
                @update:model-value="setFieldValue(field.key, $event)"
                :placeholder="field.props?.placeholder || '请选择' + field.name"
                class="modern-select"
                style="width: 100%"
              >
                <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>

              <el-select
                v-else-if="field.type === DynamicFormFieldType.MultiSelect"
                :model-value="getMultiSelectValue(field.key)"
                @update:model-value="setFieldValue(field.key, $event)"
                :placeholder="field.props?.placeholder || '请选择' + field.name"
                class="modern-select"
                multiple
                collapse-tags
                collapse-tags-tooltip
                style="width: 100%"
              >
                <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>

              <el-date-picker
                v-else-if="field.type === DynamicFormFieldType.Date"
                :model-value="getDateValue(field.key)"
                @update:model-value="setFieldValue(field.key, $event)"
                type="datetime"
                :placeholder="field.props?.placeholder || '请选择日期时间'"
                class="modern-date-picker"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </template>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType, ref } from "vue"
import type { FormInstance } from "element-plus"
import { DynamicFormFieldType } from "../types"
import type { DynamicFormData, DynamicFormField, DynamicFormModelValue } from "../types"

const props = defineProps({
  schema: {
    type: Array as PropType<DynamicFormField[]>,
    default: () => []
  },
  modelValue: {
    type: Object as PropType<DynamicFormData>,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: true
  }
})

const emits = defineEmits(["update:modelValue"])

const formRef = ref<FormInstance>()

const localModel = computed<DynamicFormData>(() => {
  return props.schema.reduce<DynamicFormData>(
    (model, field) => {
      if (field.value !== undefined && (model[field.key] === undefined || model[field.key] === "")) {
        model[field.key] = field.value
      }
      return model
    },
    { ...props.modelValue }
  )
})

const normalizeFieldValue = (value: unknown): DynamicFormModelValue => {
  if (typeof value === "string" || typeof value === "number" || value === null || value === undefined) return value
  if (value instanceof Date) return value
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  return JSON.stringify(value)
}

const getDisplayValue = (key: string, fallback?: DynamicFormModelValue) => {
  const value = normalizeFieldValue(localModel.value[key] ?? fallback)
  if (Array.isArray(value)) return value.join(", ")
  if (value instanceof Date) return value.toLocaleString()
  return value ?? undefined
}

const getTipDescription = (field: DynamicFormField) => {
  return String(field.value || field.props?.placeholder || "")
}

const isFullWidthField = (type: string) => {
  return type === DynamicFormFieldType.Textarea || type === DynamicFormFieldType.Tips
}

const getFieldSpan = (type: string) => {
  if (!props.compact || isFullWidthField(type)) return 24
  return 12
}

const getTextValue = (key: string) => {
  const value = localModel.value[key]
  return typeof value === "string" || typeof value === "number" ? value : undefined
}

const getNumberValue = (key: string) => {
  const value = localModel.value[key]
  return typeof value === "number" ? value : undefined
}

const getSelectValue = (key: string) => {
  const value = localModel.value[key]
  return typeof value === "string" || typeof value === "number" ? value : undefined
}

const getMultiSelectValue = (key: string) => {
  const value = localModel.value[key]
  return Array.isArray(value) ? value : []
}

const getDateValue = (key: string) => {
  const value = localModel.value[key]
  return typeof value === "string" || typeof value === "number" || value instanceof Date || Array.isArray(value)
    ? value
    : undefined
}

const setFieldValue = (key: string, value: DynamicFormModelValue) => {
  emits("update:modelValue", {
    ...localModel.value,
    [key]: normalizeFieldValue(value)
  })
}

const validate = () => {
  return formRef.value?.validate()
}

defineExpose({
  validate
})
</script>

<style scoped lang="scss">
.modern-input,
.modern-select,
.modern-date-picker,
.modern-input-number {
  width: 100%;
}

.modern-textarea {
  width: 100%;
}

.tips-container {
  margin-bottom: 18px;
}
</style>
