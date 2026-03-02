<template>
  <el-form
    ref="formRef"
    :model="propertyForm"
    :inline-message="true"
    :rules="formRules"
    label-position="top"
    :disabled="flowDetail.status == '2'"
    class="property-form"
  >
    <!-- 基本信息 -->
    <FormSection title="基本信息" icon="📝">
      <el-form-item label="节点名称" prop="name" class="form-item">
        <el-input
          v-model="propertyForm.name"
          clearable
          placeholder="请输入节点名称"
          class="modern-input"
          :disabled="flowDetail.status == '2'"
        />
      </el-form-item>
    </FormSection>

    <!-- 执行配置 -->
    <FormSection title="执行配置" icon="⚙️">
      <div class="settings-grid">
        <div class="setting-item">
          <el-form-item label="代码模版" prop="codebook_uid">
            <el-select
              v-model="propertyForm.codebook_uid"
              filterable
              placeholder="请选择代码模版"
              @change="handlerChangeCodebook()"
              class="modern-select"
              :disabled="flowDetail.status == '2'"
            >
              <el-option
                v-for="item in runnerTagsData"
                :key="item.codebook_uid"
                :label="item.codebook_name"
                :value="item.codebook_uid"
                class="modern-option"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="setting-item">
          <el-form-item label="标签" prop="tag">
            <el-select
              ref="tagSelect"
              v-model="propertyForm.tag"
              filterable
              placeholder="选择代码模版后可编辑"
              :disabled="!propertyForm.codebook_uid || flowDetail.status == '2'"
              class="modern-select"
            >
              <el-option
                v-for="item in availableTags"
                :key="item.tag"
                :label="item.tag"
                :value="item.tag"
                class="modern-option"
              >
                <div class="tag-info-row">
                  <span class="tag-label">{{ item.tag }}</span>
                  <span class="tag-details">
                    <el-tag size="small" type="info" effect="plain" class="inner-pill">{{ item.kind }}</el-tag>
                    {{ item.target }} <small v-if="item.handler">/ {{ item.handler }}</small>
                  </span>
                </div>
              </el-option>
              <template #footer>
                <el-button
                  text
                  bg
                  size="small"
                  type="primary"
                  style="width: 100%"
                  @click="setAutoTag"
                  class="auto-tag-btn"
                >
                  自动发现
                </el-button>
              </template>
            </el-select>
          </el-form-item>
        </div>
      </div>
    </FormSection>

    <!-- 定时设置 -->
    <FormSection title="定时设置" icon="⏰">
      <div class="settings-grid">
        <div class="setting-item">
          <el-form-item label="定时执行" prop="is_timing">
            <el-switch
              v-model="propertyForm.is_timing"
              size="default"
              :disabled="flowDetail.status == '2'"
              active-color="var(--primary)"
              inactive-color="var(--border)"
              @change="handleTimingChange"
            />
          </el-form-item>
        </div>

        <div class="setting-item">
          <el-form-item label="执行方式" prop="rule">
            <el-select
              v-model="propertyForm.exec_method"
              clearable
              @change="handleChange"
              placeholder="请选择执行方式"
              class="modern-select"
              :disabled="flowDetail.status == '2'"
            >
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
                class="modern-option"
              />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 手动设置定时 -->
      <div v-if="propertyForm.exec_method === 'hand' && propertyForm.is_timing === true" class="conditional-section">
        <div class="form-row">
          <el-form-item label="执行单位" prop="unit" class="form-item">
            <el-select
              v-model="propertyForm.unit"
              placeholder="执行单位"
              class="modern-select"
              :disabled="flowDetail.status == '2'"
            >
              <el-option
                v-for="item in unit"
                :key="item.label"
                :label="item.label"
                :value="item.value"
                class="modern-option"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="执行数值" prop="quantity" class="form-item">
            <el-input-number
              v-model="propertyForm.quantity"
              :min="1"
              size="default"
              class="modern-input-number"
              :disabled="flowDetail.status == '2'"
            />
          </el-form-item>
        </div>
      </div>

      <!-- 模板字段定时 -->
      <div
        v-if="propertyForm.exec_method === 'template' && propertyForm.is_timing === true"
        class="conditional-section"
      >
        <div class="form-row">
          <el-form-item label="模版名称" prop="leftValue" class="form-item">
            <el-select
              v-model="propertyForm.template_id"
              placeholder="请选择模版"
              class="modern-select"
              :disabled="flowDetail.status == '2'"
            >
              <el-option
                v-for="item in templateRules"
                :key="item.id"
                :label="item.name"
                :value="item.id"
                class="modern-option"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="模版字段" prop="leftValue" class="form-item">
            <el-select
              v-model="propertyForm.template_field"
              :disabled="!propertyForm.template_id || flowDetail.status == '2'"
              placeholder="请选择模版字段"
              class="modern-select"
            >
              <el-option
                v-for="[title, field] in Array.from(getTemplateFieldOptions(propertyForm.template_id || 0))"
                :key="field"
                :label="title"
                :value="field"
                class="modern-option"
              />
            </el-select>
          </el-form-item>
        </div>
      </div>
    </FormSection>

    <!-- 通知设置 -->
    <FormSection title="通知设置" icon="🔔">
      <div class="settings-grid">
        <div class="setting-item">
          <el-form-item label="开启通知" prop="is_notify">
            <el-switch
              v-model="propertyForm.is_notify"
              size="default"
              :disabled="flowDetail.status == '2'"
              active-color="var(--primary)"
              inactive-color="var(--border)"
            />
          </el-form-item>
        </div>

        <div class="setting-item">
          <el-form-item label="发送方式" prop="notify_method">
            <el-select
              multiple
              collapse-tags
              collapse-tags-tooltip
              v-model="propertyForm.notify_method"
              placeholder="消息通知方式"
              class="modern-select"
              :disabled="flowDetail.status == '2'"
            >
              <el-option
                v-for="item in notify_method"
                :key="item.label"
                :label="item.label"
                :value="item.value"
                class="modern-option"
              />
            </el-select>
          </el-form-item>
        </div>
      </div>
    </FormSection>
  </el-form>
</template>

<script setup lang="ts">
import { listRunnerTagsApi } from "@/api/runner"
import { runnerTags, TagDetail } from "@/api/runner/types/runner"
import { ElSelect, FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"
import { cloneDeep } from "lodash-es"
import { useTemplateRules } from "@/common/composables/useTemplateRules"
import { FormSection } from "../../PropertySetting"

// ── 属性与事件定义 ──────────────────────────────────────────────────────────
const props = defineProps({
  nodeData: Object,
  lf: Object || String,
  id: Number,
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

const emits = defineEmits(["closed"])

// ── 状态管理 ────────────────────────────────────────────────────────────
const DEFAULT_FORM_DATA = {
  name: "自动化-",
  codebook_uid: "",
  is_notify: false,
  is_timing: false,
  exec_method: "",
  template_field: "",
  template_id: null as number | null,
  notify_method: [],
  unit: null as number | null,
  quantity: null as number | null,
  tag: ""
}

const propertyForm = reactive(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const tagSelect = ref<InstanceType<typeof ElSelect> | null>(null)
const runnerTagsData = ref<runnerTags[]>([])
const availableTags = ref<TagDetail[]>([])

// ── 模板与执行逻辑 ──────────────────────────────────────────────────────────
const { templateRules, getTemplateFieldOptions, fetchTemplates } = useTemplateRules()

const handleChange = async () => {
  if (propertyForm.exec_method === "template") {
    propertyForm.unit = null
    propertyForm.quantity = null
  } else if (propertyForm.exec_method === "hand") {
    propertyForm.template_id = null
    propertyForm.template_field = ""
  } else {
    propertyForm.template_id = null
    propertyForm.template_field = ""
    propertyForm.unit = null
    propertyForm.quantity = null
  }

  if (propertyForm.exec_method === "template" && props.id !== undefined) {
    await fetchTemplates(props.id)
  }
}

const handleTimingChange = () => {
  if (!propertyForm.is_timing) {
    propertyForm.exec_method = ""
    propertyForm.template_id = null
    propertyForm.template_field = ""
    propertyForm.unit = null
    propertyForm.quantity = null
  } else if (!propertyForm.exec_method) {
    propertyForm.template_id = null
    propertyForm.template_field = ""
    propertyForm.unit = null
    propertyForm.quantity = null
  }
}

// ── 标签与运行器逻辑 ────────────────────────────────────────────────────────
const handlerChangeCodebook = (clearTag = true) => {
  if (clearTag) {
    propertyForm.tag = ""
  }
  const matched = runnerTagsData.value.find((item) => item.codebook_uid == propertyForm.codebook_uid)
  availableTags.value = matched?.tags || []
}

const listRunnerTags = (isInitialLoad = false) => {
  listRunnerTagsApi()
    .then((res) => {
      runnerTagsData.value = res.data.runner_tags || []
      handlerChangeCodebook(!isInitialLoad)
    })
    .catch((error) => {
      console.log(error)
    })
}

function setAutoTag() {
  propertyForm.tag = "auto"
  tagSelect.value?.blur?.()
}

// ── 节点属性同步 ────────────────────────────────────────────────────────────
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    name: propertyForm.name,
    codebook_uid: propertyForm.codebook_uid,
    is_notify: propertyForm.is_notify,
    template_field: propertyForm.template_field,
    template_id: propertyForm.template_id,
    is_timing: propertyForm.is_timing,
    notify_method: propertyForm.notify_method,
    tag: propertyForm.tag,
    unit: propertyForm.unit,
    exec_method: propertyForm.exec_method,
    quantity: propertyForm.quantity
  })
}

const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      props.lf?.updateText(props.nodeData?.id, propertyForm.name)
      emits("closed")
    }
  })
}

// ── UI 配置项 ──────────────────────────────────────────────────────────────
const options = [
  { label: "手动设置", value: "hand" },
  { label: "模版字段提取", value: "template" }
]

const unit = [
  { value: 1, label: "分钟" },
  { value: 2, label: "小时" },
  { value: 3, label: "天" }
]

const notify_method = [
  { value: 1, label: "工单结束后合并发送" },
  { value: 2, label: "当前节点完成立即发送" }
]

const formRules: FormRules = {
  name: [
    { required: true, message: "名称不能为空" },
    { max: 50, message: "最大50字符" },
    {
      validator: (rule, value, callback) => {
        if (!value.startsWith("自动化-")) {
          callback(new Error("名称必须以'自动化-'开头"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ]
}

// ── 生命周期 ────────────────────────────────────────────────────────────
onMounted(() => {
  propertyForm.name = props.nodeData?.properties.name || "自动化-"
  propertyForm.codebook_uid = props.nodeData?.properties.codebook_uid
  propertyForm.is_notify = props.nodeData?.properties.is_notify
  propertyForm.is_timing = props.nodeData?.properties.is_timing
  propertyForm.notify_method = Array.isArray(props.nodeData?.properties.notify_method)
    ? props.nodeData?.properties.notify_method
    : [props.nodeData?.properties.notify_method].filter(Boolean)

  propertyForm.template_field = props.nodeData?.properties.template_field
  propertyForm.template_id = props.nodeData?.properties.template_id
  propertyForm.tag = props.nodeData?.properties.tag
  propertyForm.exec_method = props.nodeData?.properties.exec_method
  propertyForm.unit = props.nodeData?.properties.unit
  propertyForm.quantity = props.nodeData?.properties.quantity

  listRunnerTags(true)

  if (propertyForm.exec_method === "template" && propertyForm.template_id) {
    if (props.id !== undefined) {
      fetchTemplates(props.id).then(() => {
        getTemplateFieldOptions(propertyForm.template_id || 0)
      })
    }
  }
})

defineExpose({
  confirmFunc
})
</script>

<style scoped lang="scss">
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;

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
        --el-switch-on-color: #8b5cf6;
        --el-switch-off-color: #d1d5db;
      }
    }
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
}

.conditional-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
}

.modern-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 18px;
    height: 52px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    &.is-focus {
      border-color: #8b5cf6;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
      transform: translateY(-2px);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }
}

.modern-select {
  width: 100%;

  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 18px;
    height: 52px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    &.is-focus {
      border-color: #8b5cf6;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
      transform: translateY(-2px);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }
}

.modern-input-number {
  width: 100%;

  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      background: #f8fafc !important;
      border: 2px solid #e2e8f0 !important;
      border-radius: 10px !important;
      padding: 12px 16px !important;
      height: 48px !important;
      transition: all 0.3s ease !important;
      box-shadow: none !important;
      min-height: 48px !important;
      max-height: 48px !important;

      &:hover {
        border-color: #cbd5e1 !important;
        background: #f1f5f9 !important;
      }

      &.is-focus {
        border-color: #8b5cf6 !important;
        background: #ffffff !important;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
      }
    }

    .el-input__inner {
      font-size: 14px !important;
      color: #1e293b !important;
      font-weight: 500 !important;
      text-align: center !important;
      height: 24px !important;
      line-height: 24px !important;
    }
  }

  :deep(.el-input-number__decrease),
  :deep(.el-input-number__increase) {
    display: none !important;
  }
}

.modern-option {
  :deep(.el-select-dropdown__item) {
    padding: 8px 16px;
    height: auto;
    font-size: 14px;

    .tag-info-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
      line-height: 1.4;
      padding: 4px 0;

      .tag-label {
        font-weight: 700;
        color: #1e293b;
      }

      .tag-details {
        font-size: 11px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 6px;

        .inner-pill {
          font-weight: 800;
          font-size: 9px;
          height: 18px;
          padding: 0 4px;
        }
      }
    }

    &.selected {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;

      .tag-label,
      .tag-details {
        color: white;
      }

      .inner-pill {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.1);
      }
    }

    &:hover {
      background: #f1f5f9;
    }
  }
}

.form-help {
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #8b5cf6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.auto-tag-btn {
  color: #8b5cf6 !important;
  font-weight: 600;

  &:hover {
    background: rgba(139, 92, 246, 0.1) !important;
  }
}

.dialog-footer {
  padding: 16px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.footer-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.footer-btn-cancel {
  background: #ffffff;
  color: #64748b;
  border-color: #e2e8f0;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }
}

.footer-btn-confirm {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border-color: #8b5cf6;

  &:hover {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    border-color: #7c3aed;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }
}
</style>
