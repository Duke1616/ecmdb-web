<template>
  <div class="rule-form-container">
    <!-- 表单内容 -->
    <div class="form-content">
      <!-- 左值和右值区域 - 左右布局 -->
      <div class="values-container">
        <!-- 左值区域 -->
        <div class="condition-block left-block">
          <div class="block-header">
            <span class="block-title">左值</span>
            <span class="required-mark">*</span>
          </div>

          <div class="field-group">
            <div class="field-item">
              <label class="field-label">模板</label>
              <el-select
                v-model="formData.leftValue"
                placeholder="请选择模板"
                class="modern-select"
                @change="handleChangeLeftValue"
              >
                <el-option
                  v-for="(item, index) in props.templates"
                  :key="index"
                  :label="item.name"
                  :value="item.name"
                />
              </el-select>
            </div>

            <div class="field-item">
              <label class="field-label">字段</label>
              <el-select
                v-model="formData.leftValueData"
                :disabled="!formData.leftValue"
                placeholder="请选择具体字段"
                class="modern-select"
              >
                <el-option
                  v-for="(item, index) in getOptionsForLeftValue()"
                  :key="index"
                  :label="item[0]"
                  :value="item[1]"
                />
              </el-select>
            </div>
          </div>
        </div>

        <!-- 右值区域 -->
        <div class="condition-block right-block">
          <div class="block-header">
            <span class="block-title">右值</span>
            <span class="required-mark">*</span>
          </div>

          <div class="field-group">
            <div class="field-item">
              <label class="field-label">类型</label>
              <el-select
                v-model="formData.rightValue"
                disabled
                placeholder="预留字段"
                class="modern-select"
                @change="onRightValueChange"
              >
                <el-option label="预留字段" value="reserve" />
              </el-select>
            </div>

            <div class="field-item">
              <label class="field-label">值</label>
              <template v-if="isFieldInMap">
                <el-select
                  v-model="formData.rightValueData"
                  :multiple="isMultiple"
                  placeholder="请选择值"
                  class="modern-select"
                >
                  <el-option
                    v-for="item in selectOptionsMap.get(formData.leftValueData) || []"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </template>
              <template v-else>
                <el-input v-model="rightValueDataComputed" placeholder="请输入值" class="modern-input" />
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 运算符区域 - 在下面 -->
      <div class="operator-block">
        <div class="block-header">
          <span class="block-title">运算符</span>
          <span class="required-mark">*</span>
        </div>

        <div class="operator-content">
          <div class="operator-buttons">
            <button
              v-for="op in operatorOptions"
              :key="op.value"
              :class="['operator-btn', { active: formData.operator === op.value }]"
              @click.prevent="selectOperator(op.value)"
              type="button"
            >
              <span class="operator-symbol">{{ op.symbol }}</span>
              <span class="operator-text">{{ op.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 表达式预览区域 -->
      <div class="expression-preview">
        <div class="block-header">
          <span class="block-title">表达式预览</span>
        </div>
        <div class="preview-content">
          <div class="preview-text">{{ getExpressionPreview() }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue"
import { template } from "@/api/template/types/template"

interface Props {
  templates: template[]
}

const props = defineProps<Props>()

const templatesMap = computed(() => {
  const map = new Map<string, template>()
  props.templates.forEach((template) => {
    map.set(template.name, template)
  })
  return map
})

const handleChangeLeftValue = () => {
  formData.rightValueData = ""
  formData.leftValueData = ""
}

const formData = reactive({
  leftValue: "",
  leftValueData: "",
  operator: "",
  rightValue: "reserve",
  rightValueData: "" as string | string[]
})

// 运算符选项
const operatorOptions = [
  { value: "=", label: "等于", symbol: "=" },
  { value: "!=", label: "不等于", symbol: "!=" },
  { value: ">", label: "大于", symbol: ">" },
  { value: "<", label: "小于", symbol: "<" },
  { value: "in", label: "包含", symbol: "in" },
  { value: "not in", label: "不包含", symbol: "not in" }
]

// 选择运算符
const selectOperator = (value: string) => {
  formData.operator = value
  console.log("选择运算符:", value)
}

const selectOptionsMap = ref(new Map<string, Array<{ value: string; label: string }>>())

const isFieldInMap = computed(() => {
  return selectOptionsMap.value.has(formData.leftValueData)
})

const isMultiple = computed(() => {
  return formData.operator === "in" || formData.operator === "not in"
})

const rightValueDataComputed = computed({
  get: () => {
    return Array.isArray(formData.rightValueData) ? formData.rightValueData.join(",") : formData.rightValueData
  },
  set: (val: string) => {
    formData.rightValueData = isMultiple.value ? val.split(",") : val
  }
})

const onRightValueChange = () => {
  if (isMultiple.value) {
    if (!Array.isArray(formData.rightValueData)) {
      formData.rightValueData = []
    }
  } else {
    formData.rightValueData = ""
  }
}

const getOptionsForLeftValue = () => {
  const template = templatesMap.value.get(formData.leftValue)
  if (!template || !template.rules) return []

  return template.rules.map((rule: any) => [rule.title || "", rule.field || ""])
}

const getExpressionPreview = () => {
  if (!formData.leftValueData || !formData.operator || !formData.rightValueData) {
    return "请完善条件配置以查看表达式预览"
  }

  const left = `$${formData.leftValueData}`
  const operator = formData.operator
  let right = ""

  if (Array.isArray(formData.rightValueData)) {
    const values = formData.rightValueData
      .map((value) => {
        const numericValue = parseFloat(value)
        return !isNaN(numericValue) ? numericValue.toString() : `'${value}'`
      })
      .join(", ")
    right = `(${values})`
  } else {
    const numericValue = parseFloat(formData.rightValueData)
    right = !isNaN(numericValue) ? numericValue.toString() : `'${formData.rightValueData}'`
  }

  return `${left} ${operator} ${right}`
}

const getForm = () => {
  // 简单的数据验证
  if (!formData.leftValueData || !formData.operator || !formData.rightValueData) {
    console.error("表单数据不完整")
    return null
  }

  console.log("表单数据验证通过，继续执行后续逻辑")
  return formData
}

const resetForm = () => {
  formData.leftValueData = ""
  formData.rightValueData = ""
}

defineExpose({
  getForm,
  resetForm
})

watch([() => formData.leftValueData], () => {
  if (isFieldInMap.value) {
    formData.rightValueData = isMultiple.value ? [] : ""
  } else {
    formData.rightValueData = ""
  }
})

// 初始化时设置字段映射
watch(
  () => formData.leftValue,
  (newValue) => {
    if (newValue && props.templates) {
      const template = props.templates.find((t) => t.name === newValue)
      if (template && template.rules) {
        const optionsMap = new Map<string, Array<{ value: string; label: string }>>()

        template.rules.forEach((rule: any) => {
          if (rule.field && rule.options && Array.isArray(rule.options)) {
            optionsMap.set(rule.field, rule.options)
          }
        })

        selectOptionsMap.value = optionsMap
      }
    }
  }
)
</script>

<style scoped>
.rule-form-container {
  padding: 0;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  max-height: 80vh; /* 限制最大高度 */
  overflow-y: auto; /* 添加垂直滚动 */
}

/* 表单标题样式 */
.form-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border-radius: 12px;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.header-text {
  flex: 1;
}

.header-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.header-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.4;
  font-weight: 500;
}

/* 表单内容样式 */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 左值和右值容器 - 左右布局 */
.values-container {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.values-container .condition-block {
  flex: 1;
  min-width: 0; /* 防止flex子项溢出 */
}

/* 条件块样式 */
.condition-block {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

/* 移除悬停效果 */

.left-block {
  border-left: 4px solid #06b6d4;
}

.right-block {
  border-left: 4px solid #10b981;
}

.block-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.block-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.required-mark {
  color: #ef4444;
  font-weight: 800;
  font-size: 16px;
}

/* 字段组样式 */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  padding-left: 4px;
}

/* 运算符块样式 - 在下面 */
.operator-block {
  background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
  border: 2px solid #f59e0b;
  border-radius: 16px;
  padding: 16px;
  text-align: center;
}

/* 移除悬停效果 */

.operator-content {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* 运算符按钮组样式 */
.operator-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  max-width: 100%;
}

.operator-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border: 2px solid #f59e0b;
  border-radius: 10px;
  background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
  color: #92400e;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
  min-height: 50px;
}

.operator-btn:hover {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #d97706;
  transform: translateY(-1px);
}

.operator-btn.active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #d97706;
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.operator-symbol {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 3px;
  line-height: 1;
}

.operator-text {
  font-size: 11px;
  line-height: 1;
}

/* 表达式预览区域 */
.expression-preview {
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
  border: 2px solid #10b981;
  border-radius: 16px;
  padding: 16px;
}

/* 移除悬停效果 */

.preview-content {
  margin-top: 16px;
}

.preview-text {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  color: #065f46;
  font-weight: 600;
  text-align: center;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 现代化输入框样式 */
.modern-input,
.modern-select {
  width: 100%;
}

/* 运算符选择器样式已移除，使用自定义按钮组 */

/* 滚动条样式 */
.rule-form-container::-webkit-scrollbar {
  width: 8px;
}

.rule-form-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.rule-form-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.rule-form-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
