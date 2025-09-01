<template>
  <div class="info-container">
    <div class="info-content">
      <el-form
        ref="formRef"
        :model="localFormData"
        :rules="formRules"
        label-position="top"
        class="form-card"
        @submit.prevent="handleFormNext"
      >
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <div class="section-title">
              <h3>模板标识</h3>
              <p>为您的模板设置名称和基本信息</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <div class="field-label">
                <span class="label-text">模板名称</span>
                <span class="required">*</span>
              </div>
              <div class="input-container">
                <el-form-item prop="name" class="no-margin">
                  <el-input
                    v-model="localFormData.name"
                    @input="updateFormData"
                    placeholder="请输入模板名称，如：用户注册表单"
                    class="modern-input"
                    size="large"
                  />
                </el-form-item>
              </div>
            </div>

            <div class="form-field">
              <div class="field-label">
                <span class="label-text">所属分组</span>
                <span class="required">*</span>
              </div>
              <div class="input-container">
                <el-form-item prop="group_id" class="no-margin">
                  <el-select
                    v-model="localFormData.group_id"
                    @change="updateFormData"
                    placeholder="请选择分组"
                    class="modern-select"
                  >
                    <el-option v-for="item in templateGroupsData" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-form-item>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <div class="section-title">
              <h3>关联配置</h3>
              <p>设置模板关联的流程和图标</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <div class="field-label">
                <span class="label-text">关联流程</span>
                <span class="required">*</span>
              </div>
              <div class="input-container">
                <el-form-item prop="workflow_id" class="no-margin">
                  <el-select
                    v-model="localFormData.workflow_id"
                    @change="updateFormData"
                    placeholder="请选择流程"
                    class="modern-select"
                  >
                    <el-option v-for="item in workFlowsData" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-form-item>
              </div>
            </div>

            <div class="form-field">
              <div class="field-label">
                <span class="label-text">应用图标</span>
                <span class="required">*</span>
              </div>
              <div class="input-container">
                <el-form-item prop="icon" class="no-margin">
                  <e-icon-picker
                    v-model="localFormData.icon"
                    @change="updateFormData"
                    placeholder="请选择图标"
                    class="modern-icon-picker"
                  />
                </el-form-item>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div class="section-title">
              <h3>模板描述</h3>
              <p>详细描述模板的目的和功能</p>
            </div>
          </div>

          <div class="form-field full-width">
            <div class="field-label">
              <span class="label-text">模板说明</span>
            </div>
            <div class="input-container">
              <el-form-item prop="desc" class="no-margin">
                <el-input
                  v-model="localFormData.desc"
                  type="textarea"
                  @input="updateFormData"
                  placeholder="请详细描述此模板的目的、适用场景、预期效果等信息..."
                  :rows="6"
                  class="modern-textarea"
                  size="large"
                />
              </el-form-item>
              <div class="input-hint">清晰的描述有助于团队成员理解和执行模板</div>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 操作按钮 -->
    <FormActions @next="handleFormNext" @cancel="close" :show-previous="false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { listTemplateGroupApi } from "@/api/template"
import { listWorkflowApi } from "@/api/workflow/workflow"
import { createOrUpdateTemplateReq, templateGroup } from "@/api/template/types/template"
import { workflow } from "@/api/workflow/types/workflow"
import FormActions from "@/common/components/FormActions/index.vue"
import { useFormHandler } from "@/common/composables/useFormHandler"
import "vue3-icon-picker/dist/style.css"

const props = defineProps<{
  formData: createOrUpdateTemplateReq
}>()

const emits = defineEmits<{
  next: []
  close: []
  "update:formData": [data: createOrUpdateTemplateReq]
}>()

const { localFormData, updateFormData, next, close, setFormData } = useFormHandler(props.formData, emits, "info")

const formRef = ref<FormInstance | null>(null)

const formRules: FormRules = {
  name: [
    { required: true, message: "请输入模板名称", trigger: "blur" },
    { min: 2, max: 50, message: "名称长度在 2 到 50 个字符", trigger: "blur" }
  ],
  group_id: [{ required: true, message: "请选择所属分组", trigger: "change" }],
  workflow_id: [{ required: true, message: "请选择关联流程", trigger: "change" }],
  icon: [{ required: true, message: "请选择应用图标", trigger: "change" }]
}

// 处理下一步，先进行表单校验
const handleFormNext = () => {
  if (!formRef.value) return

  formRef.value.validate((valid, fields) => {
    if (valid) {
      next()
    } else {
      console.log("表单校验失败:", fields)
      // 可以增加提示
      ElMessage.warning("请完善必填项")
    }
  })
}

/** 查询模版列表 */
const templateGroupsData = ref<templateGroup[]>([])
const listTemplateGroups = () => {
  listTemplateGroupApi({
    offset: 0,
    limit: 100
  })
    .then(({ data }) => {
      templateGroupsData.value = data.template_groups
    })
    .catch(() => {
      templateGroupsData.value = []
    })
    .finally(() => {})
}

/** 查询流程列表 */
const workFlowsData = ref<workflow[]>([])
const listWorkFlowsData = () => {
  listWorkflowApi({
    offset: 0,
    limit: 100
  })
    .then(({ data }) => {
      workFlowsData.value = data.workflows
    })
    .catch(() => {
      workFlowsData.value = []
    })
    .finally(() => {})
}

onMounted(() => {
  listTemplateGroups()
  listWorkFlowsData()
})

watch(
  () => props.formData,
  (newFormData) => {
    setFormData(newFormData)
  },
  { deep: true, immediate: true }
)
</script>

<style lang="scss" scoped>
.info-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 500px;
}

// 信息内容
.info-content {
  flex: 1;
  padding: 0px 32px;
  overflow-y: auto;

  .form-card {
    background: white;
    border-radius: 12px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    max-width: 800px;
    margin: 0 auto;
  }
}

// 表单区块
.form-section {
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;

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
}

// 表单网格
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

// 表单字段
.form-field {
  &.full-width {
    grid-column: 1 / -1;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;

    .label-text {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .required {
      color: #ef4444;
      font-weight: 600;
    }
  }

  .input-container {
    .input-hint {
      margin-top: 6px;
      font-size: 11px;
      color: #6b7280;
      line-height: 1.4;
    }
  }
}

// 隐藏 el-form-item 的默认样式，保持现有的 UI 样式
:deep(.no-margin) {
  margin-bottom: 0;

  .el-form-item__content {
    margin-left: 0 !important;
  }

  .el-form-item__error {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    font-size: 11px;
    color: #ef4444;
    line-height: 1.2;
  }
}

// 现代化输入框样式
:deep(.modern-input) {
  .el-input__wrapper {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px 16px;
    min-height: 42px;
    height: 42px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      border-color: #667eea;
      background: #f1f5f9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    &.is-focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }
  }

  .el-input__inner {
    color: #1e293b;
    font-size: 13px;
    font-weight: 500;

    &::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }
  }
}

:deep(.modern-textarea) {
  .el-textarea__inner {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 18px;
    color: #1e293b;
    font-size: 13px;
    line-height: 1.6;
    resize: vertical;
    min-height: 120px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      border-color: #667eea;
      background: #f1f5f9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    &:focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }

    &::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }
  }
}

:deep(.modern-select) {
  .el-input__wrapper {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px 16px;
    min-height: 42px;
    height: 42px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      border-color: #667eea;
      background: #f1f5f9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    &.is-focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }
  }
}

:deep(.modern-icon-picker) {
  .el-input__wrapper {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px 16px;
    min-height: 42px;
    height: 42px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      border-color: #667eea;
      background: #f1f5f9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    &.is-focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .info-content {
    padding: 16px;
  }

  .form-card {
    border-radius: 12px;
  }

  .form-section {
    padding: 24px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .info-content {
    padding: 12px;
  }

  .form-section {
    padding: 20px;
  }
}
</style>
