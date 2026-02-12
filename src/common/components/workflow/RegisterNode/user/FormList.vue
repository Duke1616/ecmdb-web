<template>
  <div class="form-list-wrapper">
    <div class="section-header">
      <div class="title-area">
        <span class="title">表单字段配置</span>
      </div>
      <el-button type="primary" link size="small" @click="handleAdd" :disabled="disabled">
        <el-icon class="mr-1">
          <Plus />
        </el-icon>
        添加字段
      </el-button>
    </div>

    <div v-if="!localList || localList.length === 0" class="empty-list">
      <el-empty description="暂无表单配置" :image-size="60" />
    </div>

    <div v-else class="field-list">
      <div v-for="(item, index) in localList" :key="index" class="field-item">
        <div class="field-info">
          <div class="field-main">
            <span class="field-name">{{ item.name }}</span>
            <span class="field-key">Key: {{ item.key }}</span>
          </div>
          <div class="field-tags">
            <el-tag size="small" :type="item.required ? 'danger' : 'info'" effect="light" class="type-tag">
              {{ getTypeLabel(item.type) }}
            </el-tag>
            <el-tag v-if="item.required" type="danger" size="small" effect="plain" class="ml-2 required-tag"
              >必填</el-tag
            >
            <el-tag v-if="item.readonly" type="info" size="small" effect="plain" class="ml-2 readonly-tag">只读</el-tag>
            <el-tag v-if="item.merge" type="warning" size="small" effect="plain" class="ml-2 merge-tag">合并</el-tag>
          </div>
        </div>
        <div class="field-actions" v-if="!disabled">
          <el-button circle size="small" class="action-btn edit-btn" @click="handleEdit(index)">
            <el-icon>
              <Edit />
            </el-icon>
          </el-button>
          <el-button circle size="small" class="action-btn delete-btn" @click="handleDelete(index)">
            <el-icon>
              <Delete />
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <FormDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑字段' : '添加字段'"
      :subtitle="isEdit ? '修改表单字段配置' : '添加新的表单字段'"
      width="600px"
      :show-footer-info="false"
      @confirm="handleConfirm"
      @cancel="dialogVisible = false"
      @closed="resetDialog"
    >
      <el-form ref="formRef" :model="currentForm" :rules="rules" label-position="top" class="design-form">
        <!-- Top Options Bar -->
        <div class="options-bar">
          <div class="option-item">
            <span class="option-label">必填项</span>
            <el-switch v-model="currentForm.required" size="small" style="--el-switch-on-color: #3b82f6" />
          </div>
          <div class="divider-vertical" />
          <div class="option-item">
            <span class="option-label">后续合并</span>
            <el-tooltip content="启用后，该字段值将在后续审批节点中持续展示" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
            <el-switch v-model="currentForm.merge" size="small" style="--el-switch-on-color: #e6a23c" />
          </div>
          <div class="divider-vertical" />
          <div class="option-item">
            <span class="option-label">隐藏字段</span>
            <el-tooltip content="启用后，该字段将不会在表单中展示，通常用于系统自动填充" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
            <el-switch v-model="currentForm.hidden" size="small" style="--el-switch-on-color: #909399" />
          </div>
          <div class="divider-vertical" />
          <div class="option-item">
            <span class="option-label">只读模式</span>
            <el-tooltip content="启用后，该字段将变为只读状态，用户无法修改" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
            <el-switch v-model="currentForm.readonly" size="small" style="--el-switch-on-color: #606266" />
          </div>
        </div>

        <div class="form-grid">
          <el-form-item label="显示名称" prop="name">
            <el-input
              v-model="currentForm.name"
              placeholder="请输入字段名称，如：申请原因"
              class="modern-input"
              size="large"
            />
          </el-form-item>

          <el-form-item label="字段标识 (Key)" prop="key">
            <el-input
              v-model="currentForm.key"
              placeholder="请输入唯一标识英文，如：reason"
              class="modern-input"
              size="large"
            >
              <template #suffix>
                <el-tooltip content="后端存储的字段键名，同一节点下需唯一" placement="top">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
        </div>

        <div class="form-grid">
          <el-form-item label="字段类型" prop="type">
            <el-select
              v-model="currentForm.type"
              placeholder="请选择字段类型"
              class="modern-select"
              style="width: 100%"
              size="large"
            >
              <el-option v-for="t in fieldTypes" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </el-form-item>

          <el-form-item
            v-if="!currentForm.readonly && currentForm.type !== 'tips'"
            label="占位提示"
            prop="props.placeholder"
          >
            <el-input
              v-model="currentForm.props.placeholder"
              placeholder="用户输入时的提示文本"
              class="modern-input"
              size="large"
            />
          </el-form-item>

          <el-form-item v-else :label="currentForm.type === 'tips' ? '提示内容' : '默认值'" prop="value">
            <el-input
              v-model="currentForm.value"
              :placeholder="currentForm.type === 'tips' ? '请输入提示的具体内容' : '请输入该字段的默认显示值'"
              class="modern-input"
              size="large"
            />
          </el-form-item>
        </div>

        <el-form-item v-if="['input', 'textarea'].includes(currentForm.type)" label="正则校验" prop="validate">
          <el-input
            v-model="currentForm.validate"
            placeholder="请输入正则表达式，如：^\d{11}$"
            class="modern-input"
            size="large"
          >
            <template #prefix>
              <span class="regex-prefix">/</span>
            </template>
            <template #suffix>
              <span class="regex-suffix">/</span>
            </template>
          </el-input>
        </el-form-item>

        <!-- Options for Select -->
        <transition name="el-zoom-in-top">
          <div
            v-if="['select', 'radio', 'checkbox', 'multi_select'].includes(currentForm.type)"
            class="options-config-panel"
          >
            <div class="panel-header">
              <span class="panel-title">选项配置</span>
              <el-button link type="primary" size="small" @click="addOption">
                <el-icon class="mr-1"><Plus /></el-icon> 添加选项
              </el-button>
            </div>

            <div class="options-list-container">
              <div v-if="!currentForm.options || currentForm.options.length === 0" class="empty-options">
                <p>暂无选项，请添加</p>
              </div>
              <div v-else v-for="(opt, idx) in currentForm.options" :key="idx" class="option-item-row">
                <div class="option-inputs">
                  <el-input v-model="opt.label" placeholder="选项名 (Label)" size="small" class="sub-input" />
                  <span class="separator">:</span>
                  <el-input v-model="opt.value" placeholder="选项值 (Value)" size="small" class="sub-input" />
                </div>
                <el-button circle type="danger" size="small" plain @click="removeOption(idx)" class="remove-btn">
                  <el-icon><Minus /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </transition>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue"
import { Plus, Delete, Edit, QuestionFilled, Minus } from "@element-plus/icons-vue"
import FormDialog from "@@/components/Dialogs/Form/index.vue"
import type { FormInstance, FormRules } from "element-plus"

interface OptionItem {
  label: string
  value: string
}

interface FormItemConfig {
  name: string
  key: string
  type: string
  value?: string
  validate?: string
  required: boolean
  readonly: boolean
  hidden: boolean
  merge: boolean
  options: OptionItem[]
  props: Record<string, string>
}

const props = defineProps<{
  modelValue: FormItemConfig[]
  disabled?: boolean
}>()

const emits = defineEmits(["update:modelValue"])

const localList = ref<FormItemConfig[]>([])

watch(
  () => props.modelValue,
  (val) => {
    console.log("FormList modelValue changed:", val)
    localList.value = val ? JSON.parse(JSON.stringify(val)) : []
    console.log("FormList localList set to:", localList.value)
  },
  { immediate: true, deep: true }
)

const dialogVisible = ref(false)
const isEdit = ref(false)
const editIndex = ref(-1)
const formRef = ref<FormInstance>()

const currentForm = reactive<FormItemConfig>({
  name: "",
  key: "",
  type: "input",
  value: "",
  validate: "",
  required: false,
  readonly: false,
  hidden: false,
  merge: false,
  options: [],
  props: {}
})

watch(
  () => currentForm.type,
  (val) => {
    if (!["input", "textarea"].includes(val)) {
      currentForm.validate = ""
    }
  }
)

const fieldTypes = [
  { label: "单行文本", value: "input" },
  { label: "多行文本", value: "textarea" },
  { label: "数字输入", value: "number" },
  { label: "日期时间", value: "date" },
  { label: "下拉选择", value: "select" },
  { label: "多项选择", value: "multi_select" },
  { label: "提示信息", value: "tips" }
]

const rules: FormRules = {
  name: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
  key: [{ required: true, message: "请输入字段Key", trigger: "blur" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }]
}

const getTypeLabel = (type: string) => {
  const found = fieldTypes.find((t) => t.value === type)
  return found ? found.label : type
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (index: number) => {
  isEdit.value = true
  editIndex.value = index
  const item = localList.value[index]
  currentForm.name = item.name
  currentForm.key = item.key
  currentForm.type = item.type
  currentForm.value = item.value || ""
  currentForm.validate = item.validate || ""
  currentForm.required = item.required
  currentForm.readonly = item.readonly || false
  currentForm.hidden = item.hidden || false
  currentForm.merge = item.merge
  currentForm.options = item.options ? JSON.parse(JSON.stringify(item.options)) : []
  currentForm.props = item.props ? JSON.parse(JSON.stringify(item.props)) : {}
  if (!currentForm.props) currentForm.props = {}

  dialogVisible.value = true
}

const handleDelete = (index: number) => {
  localList.value.splice(index, 1)
  emitChange()
}

const resetForm = () => {
  currentForm.name = ""
  currentForm.key = ""
  currentForm.type = "input"
  currentForm.value = ""
  currentForm.validate = ""
  currentForm.required = false
  currentForm.readonly = false
  currentForm.hidden = false
  currentForm.merge = false
  currentForm.options = []
  currentForm.props = {}
  if (formRef.value) formRef.value.resetFields()
}

const resetDialog = () => {
  resetForm()
}

const handleConfirm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      const newItem = JSON.parse(JSON.stringify(currentForm))
      if (isEdit.value) {
        localList.value[editIndex.value] = newItem
      } else {
        localList.value.push(newItem)
      }
      emitChange()
      dialogVisible.value = false
    }
  })
}

const emitChange = () => {
  emits("update:modelValue", localList.value)
}

const addOption = () => {
  if (!currentForm.options) currentForm.options = []
  currentForm.options.push({ label: "", value: "" })
}

const removeOption = (idx: number) => {
  currentForm.options.splice(idx, 1)
}
</script>

<style scoped lang="scss">
.form-list-wrapper {
  margin-top: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .title-area {
    .title {
      font-weight: 600;
      font-size: 14px;
      color: #333;
    }
  }
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  &:hover {
    border-color: #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
  }

  .field-info {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .field-main {
      display: flex;
      align-items: center;
      gap: 8px;

      .field-name {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
      }

      .field-key {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        color: #94a3b8;
        background: #f8fafc;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .field-tags {
      display: flex;
      gap: 6px;
      align-items: center;
    }
  }

  .field-actions {
    display: flex;
    gap: 8px;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }

    .action-btn {
      border: none;
      background: transparent;

      &:hover {
        background: #f1f5f9;
      }

      &.delete-btn:hover {
        color: #ef4444;
        background: #fef2f2;
      }

      &.edit-btn:hover {
        color: #3b82f6;
        background: #eff6ff;
      }
    }
  }
}

/* Dialog Design */
.design-form {
  padding: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #475569;
  font-size: 13px;
  padding-bottom: 6px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

.modern-input,
.modern-select {
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

.help-icon {
  color: #94a3b8;
  cursor: help;
  transition: color 0.2s;

  &:hover {
    color: #64748b;
  }
}

.switch-item {
  margin-bottom: 0;
}

.switch-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 42px; /* Match input height */
  background: #fff;
  border-radius: 8px;
  padding: 0 12px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 0 0 1px #cbd5e1 inset;
  }

  .switch-label {
    font-size: 14px;
    color: #1e293b; /* Match input text color */
  }
}

.options-config-panel {
  margin-top: 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .panel-title {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }
  }

  .options-list-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 2px;
    }
  }

  .option-item-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;

    &:hover {
      border-color: #e2e8f0;
    }

    .option-inputs {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .sub-input {
        :deep(.el-input__wrapper) {
          box-shadow: none;
          background: transparent;
          padding: 0;
        }
        :deep(.el-input__inner) {
          font-size: 13px;
        }
      }

      .separator {
        color: #cbd5e1;
        font-weight: bold;
      }
    }

    .remove-btn {
      opacity: 0.5;
      &:hover {
        opacity: 1;
      }
    }
  }

  .empty-options {
    text-align: center;
    padding: 20px;
    color: #94a3b8;
    font-size: 13px;
    border: 1px dashed #e2e8f0;
    border-radius: 8px;
  }
}

.mr-1 {
  margin-right: 4px;
}
.ml-2 {
  margin-left: 8px;
}
.regex-prefix,
.regex-suffix {
  font-family: monospace;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
}

.config-card {
  margin-top: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-divider {
  height: 1px;
  background: #e2e8f0;
  width: 100%;
}

.config-label {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span:first-child {
    font-size: 14px;
    font-weight: 500;
    color: #334155;
  }
}

.config-desc {
  font-size: 12px;
  color: #94a3b8;
}
.help-icon.tiny {
  font-size: 12px;
  color: #94a3b8;
}

.options-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  padding: 8px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-label {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.divider-vertical {
  width: 1px;
  height: 14px;
  background: #cbd5e1;
}

.help-icon {
  font-size: 14px;
  color: #94a3b8;
  cursor: help;
  transition: color 0.2s;

  &:hover {
    color: #64748b;
  }
}
</style>
