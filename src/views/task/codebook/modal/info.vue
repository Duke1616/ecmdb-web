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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div class="section-title">
              <h3>脚本基本信息</h3>
              <p>为您的脚本设置名称、标识和负责人</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <div class="field-label">
                <span class="label-text">脚本名称</span>
                <span class="required">*</span>
              </div>
              <div class="input-container">
                <el-form-item prop="name" class="no-margin">
                  <el-input
                    v-model="localFormData.name"
                    @input="updateFormData"
                    placeholder="请输入脚本名称，如：用户数据同步脚本"
                    class="modern-input"
                    size="large"
                  />
                </el-form-item>
                <div class="input-hint">建议使用简洁明了的名称，便于团队理解</div>
              </div>
            </div>

            <div class="form-field">
              <div class="field-label">
                <span class="label-text">唯一标识</span>
                <span class="required">*</span>
              </div>
              <div class="input-container">
                <el-form-item prop="identifier" class="no-margin">
                  <el-input
                    v-model="localFormData.identifier"
                    @input="updateFormData"
                    placeholder="请输入唯一标识，如：user_sync_script"
                    class="modern-input"
                    size="large"
                    :disabled="false"
                  />
                </el-form-item>
                <div class="input-hint">用于系统内部识别，建议使用下划线命名</div>
              </div>
            </div>

            <div class="form-field">
              <div class="field-label">
                <span class="label-text">脚本语言</span>
                <span class="required">*</span>
              </div>
              <div class="input-container">
                <el-form-item prop="language" class="no-margin">
                  <el-select
                    v-model="localFormData.language"
                    @change="updateFormData"
                    placeholder="请选择脚本语言"
                    class="modern-select"
                    size="large"
                    :disabled="shouldDisableLanguage"
                  >
                    <el-option label="Python" value="python" />
                    <el-option label="JavaScript" value="javascript" />
                    <el-option label="Shell" value="shell" />
                  </el-select>
                </el-form-item>
                <div class="input-hint">
                  {{
                    props.formData.id
                      ? "编辑模式下脚本语言不可修改"
                      : shouldDisableLanguage
                        ? "已编写代码，脚本语言不可修改"
                        : "选择脚本的编程语言"
                  }}
                </div>
              </div>
            </div>

            <div class="form-field">
              <div class="field-label">
                <span class="label-text">负责人</span>
                <span class="required">*</span>
              </div>
              <div class="input-container">
                <el-form-item prop="owner" class="no-margin">
                  <UserPicker
                    v-model="localFormData.owner"
                    @update:modelValue="updateFormData"
                    placeholder="选择脚本负责人"
                    class="modern-select"
                  />
                </el-form-item>
                <div class="input-hint">选择负责此脚本的主要人员</div>
              </div>
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
import { ref, computed, watch } from "vue"
import UserPicker from "@@/components/UserPicker/index.vue"
import FormActions from "@@/components/FormActions/index.vue"
import { type createOrUpdateCodebookReq } from "@/api/codebook/types/codebook"
import { ElMessage, FormInstance, FormRules } from "element-plus"
// 不再需要用户API导入，owner 直接存储为 username
import { useFormHandler } from "@@/composables/useFormHandler"

interface Props {
  formData: createOrUpdateCodebookReq
}

interface Emits {
  (e: "update:formData", data: createOrUpdateCodebookReq): void
  (e: "next"): void
  (e: "close"): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const { localFormData, updateFormData, next, close, setFormData } = useFormHandler(props.formData, emits, "codebook")

// 检测是否应该禁用脚本语言选择
const shouldDisableLanguage = computed(() => {
  // 如果是编辑模式（有id），一定不能编辑语言
  if (props.formData.id) {
    return true
  }

  // 如果是创建模式，检查是否有用户编写的代码
  // 如果代码不为空且不是默认模板，则认为用户已经编写了代码
  const code = props.formData.code || ""
  const trimmedCode = code.trim()

  // 如果代码为空，说明用户还没有编写代码
  if (!trimmedCode) {
    return false
  }

  // 这里可以添加更复杂的逻辑来检测是否是默认模板
  // 暂时简单判断：如果代码长度超过50个字符，认为用户已经编写了代码
  return trimmedCode.length > 50
})

const formRef = ref<FormInstance>()

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  owner: [{ required: true, message: "必须输入管理员", trigger: "blur" }],
  identifier: [{ required: true, message: "必须输入唯一标识", trigger: "blur" }],
  language: [{ required: true, message: "必须选择脚本语言", trigger: "change" }]
}

// 监听 props 变化
watch(
  () => props.formData,
  (newData) => {
    setFormData(newData)
  },
  { deep: true, immediate: true }
)

// 处理下一步，先进行表单校验
const handleFormNext = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate()
  if (!valid) {
    ElMessage.error("请完善基本信息")
    return
  }

  // owner 现在直接存储为 username，无需转换
  updateFormData()

  next()
}
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

.modern-select :deep(.el-select__wrapper) {
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
