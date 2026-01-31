<template>
  <div class="dynamic-form">
    <el-form ref="formRef" :model="localModel" label-position="top" :disabled="disabled">
      <el-row :gutter="24">
        <el-col v-for="field in schema" :key="field.key" :span="field.type === 'textarea' ? 24 : 12">
          <el-form-item
            :label="field.name"
            :prop="field.key"
            :rules="[{ required: field.required, message: `${field.name}不能为空`, trigger: 'blur' }]"
          >
            <!-- Text Input -->
            <el-input
              v-if="field.type === 'input'"
              v-model="localModel[field.key]"
              :placeholder="field.props?.placeholder || '请输入' + field.name"
              class="modern-input"
              size="large"
            />

            <!-- Textarea -->
            <el-input
              v-else-if="field.type === 'textarea'"
              v-model="localModel[field.key]"
              type="textarea"
              :rows="3"
              :placeholder="field.props?.placeholder || '请输入' + field.name"
              class="modern-textarea"
            />

            <!-- Number Input -->
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="localModel[field.key]"
              :placeholder="field.props?.placeholder"
              class="modern-input-number"
              size="large"
              controls-position="right"
            />

            <!-- Select -->
            <el-select
              v-else-if="field.type === 'select'"
              v-model="localModel[field.key]"
              :placeholder="field.props?.placeholder || '请选择' + field.name"
              class="modern-select"
              size="large"
              style="width: 100%"
            >
              <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>

            <!-- Date Picker -->
            <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="localModel[field.key]"
              type="date"
              :placeholder="field.props?.placeholder || '请选择日期'"
              class="modern-date-picker"
              size="large"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, watch } from "vue"
import type { FormInstance } from "element-plus"

interface OptionItem {
  label: string
  value: string
}

interface FormItemConfig {
  name: string
  key: string
  type: string
  required: boolean
  options: OptionItem[]
  props: Record<string, string>
}

const props = defineProps({
  schema: {
    type: Array as PropType<FormItemConfig[]>,
    default: () => []
  },
  modelValue: {
    type: Object as PropType<Record<string, any>>,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(["update:modelValue"])

const localModel = ref<Record<string, any>>({})
const formRef = ref<FormInstance>()

const validate = () => {
  return formRef.value?.validate()
}

defineExpose({
  validate
})

watch(
  () => props.modelValue,
  (val) => {
    // Only update if different to avoid cycles, or use deep clone if needed
    // For simple form usage, we can just assign properties or look at specific changes.
    // Here we assume modelValue is the source of truth.
    if (val) {
      localModel.value = { ...val }
    }
  },
  { immediate: true, deep: true }
)

watch(
  localModel,
  (val) => {
    emits("update:modelValue", val)
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.modern-input,
.modern-select,
.modern-date-picker,
.modern-input-number {
  width: 100%;

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    padding: 1px 12px;
    height: 42px;
    border-radius: 8px;
    transition: all 0.2s;
    background-color: #fff;

    &:hover {
      box-shadow: 0 0 0 1px #cbd5e1 inset;
    }

    &.is-focus {
      box-shadow:
        0 0 0 2px rgba(59, 130, 246, 0.2),
        0 0 0 1px #3b82f6 inset;
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    height: 40px;
  }
}

.modern-textarea {
  :deep(.el-textarea__inner) {
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 14px;
    color: #1e293b;
    transition: all 0.2s;
    background-color: #fff;

    &:hover {
      box-shadow: 0 0 0 1px #cbd5e1 inset;
    }

    &:focus {
      box-shadow:
        0 0 0 2px rgba(59, 130, 246, 0.2),
        0 0 0 1px #3b82f6 inset;
    }
  }
}
</style>
