<template>
  <el-dialog
    v-model="visible"
    @closed="onClosed"
    width="500px"
    class="create-ticket-dialog"
    :close-on-click-modal="true"
    :modal-class="'dialog-modal'"
    :lock-scroll="true"
    :close-on-press-escape="true"
    align-center
    destroy-on-close
    append-to-body
  >
    <template #header>
      <div class="dialog-header">
        <div class="dialog-header-content">
          <div class="dialog-icon">
            <AppIcon :name="currentTemplate?.icon || 'DocumentAdd'" class="template-icon" />
          </div>
          <div class="dialog-title-section">
            <h3 class="dialog-title">创建工单 - {{ currentTemplate?.name || "未命名模板" }}</h3>
            <p class="dialog-subtitle">填写以下信息完成工单创建</p>
          </div>
        </div>
      </div>
    </template>

    <div class="dialog-body" v-loading="loadingDetail">
      <FormCreate v-if="visible && !loadingDetail" :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-buttons">
          <el-button @click="visible = false" size="large" :disabled="isSubmitting" class="cancel-button">
            取消
          </el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            size="large"
            :loading="isSubmitting"
            :disabled="isSubmitting || loadingDetail || !canSubmit"
            class="submit-button"
          >
            <template #loading>
              <div class="loading-content">
                <span>提交中...</span>
              </div>
            </template>
            {{ isSubmitting ? "" : "提交工单" }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue"
import { detailTemplateApi } from "@/api/ticket/template"
import { submitTicketApi } from "@/api/ticket/manager"
import type { SubmitTicketReq } from "@/api/ticket/manager/types/manager"
import type { Api, FormRule, Options } from "@form-create/element-ui"
import formCreate from "@form-create/element-ui"
import { ElMessage } from "element-plus"
import AppIcon from "@/common/components/AppIcon/index.vue"

// NOTE: 该组件为纯隔离出来的状态型 UI，使用 defineModel 控制显隐
const visible = defineModel<boolean>("visible", { default: false })

const props = defineProps<{
  templateId: number | null
  canSubmit?: boolean
}>()

const FormCreate = formCreate.$form()

const loadingDetail = ref(false)
const isSubmitting = ref(false)
const currentTemplate = ref<{ id: number; name: string; icon: string; workflow_id: number } | null>(null)

const fApi = ref<Api>()
const rule = ref<FormRule[]>([])
const options = ref<Options>({})
const data = ref<any>({})

const reset = () => {
  rule.value = []
  options.value = {}
  data.value = {}
  currentTemplate.value = null
}

watch(
  () => visible.value,
  async (newVal) => {
    if (newVal) {
      document.body.style.overflow = "hidden"
      if (props.templateId) {
        await fetchTemplateDetail(props.templateId)
      }
    } else {
      document.body.style.overflow = ""
    }
  }
)

const fetchTemplateDetail = async (id: number) => {
  loadingDetail.value = true
  try {
    const res = await detailTemplateApi(id)
    currentTemplate.value = {
      id,
      name: res.data.name,
      icon: res.data.icon,
      workflow_id: res.data.workflow_id
    }

    options.value = {
      ...formCreate.parseJson(res.data.options),
      submitBtn: false
    } as Options

    rule.value = formCreate.parseJson(res.data.rules)
  } catch (error) {
    console.error("获取模板详情失败:", error)
    visible.value = false
  } finally {
    loadingDetail.value = false
  }
}

const validateFormData = async (): Promise<boolean> => {
  if (!fApi.value) {
    ElMessage.error("表单未正确初始化")
    return false
  }

  try {
    const valid = await fApi.value.validate()
    if (valid === true) return true
    return false
  } catch (err) {
    console.error("表单验证失败:", err)
    return false
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value || !currentTemplate.value) return
  if (!props.canSubmit) {
    ElMessage.warning("暂无提交工单权限")
    return
  }
  isSubmitting.value = true

  try {
    const isValid = await validateFormData()
    if (!isValid) {
      ElMessage.error("请检查表单中的必填项和格式要求")
      isSubmitting.value = false
      return
    }

    const formData: SubmitTicketReq = {
      data: data.value,
      template_id: currentTemplate.value.id,
      workflow_id: currentTemplate.value.workflow_id
    }

    await submitTicketApi(formData)
    visible.value = false
    ElMessage.success("工单创建成功")
  } catch (error) {
    console.error("提交失败", error)
  } finally {
    isSubmitting.value = false
  }
}

const onClosed = () => {
  isSubmitting.value = false
  reset()
}

onUnmounted(() => {
  document.body.style.overflow = ""
})
</script>

<style lang="scss" scoped>
:deep(.el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
  padding: 1rem;
}

.footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;

  @media (max-width: 480px) {
    flex-direction: column-reverse;
    gap: 0.75rem;

    .el-button {
      width: 100%;
    }
  }

  .cancel-button {
    min-width: 100px;
    height: 44px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 0.9rem;
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    color: #6b7280;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #374151;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .submit-button {
    min-width: calc(6rem + 1vw);
    height: calc(2.2rem + 0.3vw);
    border-radius: calc(0.5rem + 0.1vw);
    font-weight: 600;
    font-size: calc(0.7rem + 0.1vw);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .submit-button:hover:not(:disabled):not(.is-loading) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }
}

.create-ticket-dialog {
  padding: calc(0.6rem + 0.1vw);
  border-top: 1px solid #f1f5f9;

  @media (max-width: 768px) {
    padding: calc(0.8rem + 0.2vw);
  }
}
</style>

<style lang="scss">
/* 全局样式：处理 append-to-body 后的弹窗样式 */
.create-ticket-dialog {
  .el-dialog {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.1),
      0 8px 10px -6px rgba(0, 0, 0, 0.1);

    @media (max-width: 768px) {
      margin: 10px;
      width: calc(100% - 20px) !important;
      max-width: none !important;
    }
  }

  .el-dialog__body {
    padding: 0;
  }

  .el-dialog__footer {
    padding: 0;
    background: transparent;
  }
}

.dialog-modal {
  background: rgba(0, 0, 0, 0.4) !important;
}
</style>

<style lang="scss" scoped>
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  position: relative;
  z-index: 1;
}

.dialog-header-content {
  display: flex;
  align-items: flex-start;
  gap: calc(0.5rem + 0.1vw);
  flex: 1;
}

.dialog-title {
  margin: 0;
  font-size: calc(1rem + 0.1vw);
  font-weight: 600;
  color: #1f2937;
  line-height: 1.5;
}

.dialog-subtitle {
  margin: calc(0.15rem + 0.05vw) 0 0;
  font-size: calc(0.7rem + 0.1vw);
  color: #6b7280;
  line-height: 1.4;
}

.dialog-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(2.5rem + 0.5vw);
  height: calc(2.5rem + 0.5vw);
  background: #f3f4f6;
  border-radius: calc(0.5rem + 0.1vw);
  color: #4f46e5;
  flex-shrink: 0;
}
</style>
