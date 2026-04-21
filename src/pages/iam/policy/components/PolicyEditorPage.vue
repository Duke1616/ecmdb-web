<template>
  <div :class="pageClass">
    <PageContainer>
      <ManagerHeader
        :title="pageTitle"
        :subtitle="pageSubtitle"
        :show-back-button="true"
        :show-add-button="false"
        :show-refresh-button="false"
        :sticky="true"
        @back="handleCancel"
      >
        <template #actions>
          <el-button class="action-btn" @click="handleCancel">取消</el-button>
          <el-button type="primary" :loading="submitting" class="action-btn" @click="prepareSubmit">
            <el-icon><Check /></el-icon>
            {{ submitButtonText }}
          </el-button>
        </template>
      </ManagerHeader>

      <div class="scrollable-content">
        <div class="policy-form-container">
          <PolicyForm ref="formRef" :is-edit="isEdit" :code="policyCode" hide-basic @success="handleSuccess" />
        </div>
      </div>

      <FormDialog
        v-model="dialogVisible"
        :title="dialogTitle"
        :subtitle="dialogSubtitle"
        :header-icon="dialogHeaderIcon"
        width="500px"
        :confirm-text="dialogConfirmText"
        @confirm="handleFinalSubmit"
        @cancel="dialogVisible = false"
      >
        <div class="confirm-form-wrapper">
          <el-form ref="dialogFormRef" :model="formRef?.formData" :rules="formRef?.formRules" label-position="top">
            <el-form-item label="策略名称" prop="name">
              <el-input v-model="formRef!.formData.name" :placeholder="namePlaceholder" />
            </el-form-item>
            <el-form-item label="策略识别码 (Code)" prop="code">
              <el-input v-model="formRef!.formData.code" :disabled="isEdit" :placeholder="codePlaceholder" />
            </el-form-item>
            <el-form-item label="策略描述" prop="desc">
              <el-input
                v-model="formRef!.formData.desc"
                type="textarea"
                :rows="3"
                placeholder="简述该策略的应用场景..."
              />
            </el-form-item>
          </el-form>
        </div>
      </FormDialog>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Check } from "@element-plus/icons-vue"
import { ElMessage, type FormInstance } from "element-plus"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import PolicyForm from "../form.vue"
import { getStatementValidationMessage } from "../composables/usePolicyData"

const props = defineProps<{ mode: "create" | "edit" }>()

const route = useRoute()
const router = useRouter()
const formRef = ref<InstanceType<typeof PolicyForm>>()
const dialogFormRef = ref<FormInstance>()

const submitting = ref(false)
const dialogVisible = ref(false)

const isEdit = computed(() => props.mode === "edit")
const policyCode = computed(() => {
  const code = route.query.code
  return typeof code === "string" ? code : undefined
})

const policyName = computed(() => formRef.value?.formData?.name || "...")
const pageClass = computed(() => (isEdit.value ? "policy-edit-page" : "policy-create-page"))
const pageTitle = computed(() => (isEdit.value ? `编辑策略: ${policyName.value}` : "创建策略"))
const pageSubtitle = computed(() =>
  isEdit.value ? "修改权限语句定义，系统将自动同步变更" : "定义访问控制策略与权限语句"
)
const submitButtonText = computed(() => (isEdit.value ? "保存修改" : "立即创建"))
const dialogTitle = computed(() => (isEdit.value ? "确认策略信息" : "完善策略信息"))
const dialogSubtitle = computed(() =>
  isEdit.value ? "您可以修改策略名称或描述，识别码 (Code) 通常不建议变更" : "为您的权限策略设置名称与识别码"
)
const dialogHeaderIcon = computed(() => (isEdit.value ? "EditPen" : "DocumentChecked"))
const dialogConfirmText = computed(() => (isEdit.value ? "确认并保存" : "确认并提交"))
const namePlaceholder = computed(() => (isEdit.value ? "" : "建议简单明了，如：财务读写权限"))
const codePlaceholder = computed(() => (isEdit.value ? "" : "建议大驼峰或下划线，如：FinanceAdmin"))

const prepareSubmit = () => {
  if (!formRef.value) return

  const message = getStatementValidationMessage(
    formRef.value.formData.statement,
    isEdit.value ? "请至少保留一条权限语句" : "请至少添加一条权限语句"
  )
  if (message) {
    return ElMessage.warning(message)
  }

  dialogVisible.value = true
}

const handleFinalSubmit = async () => {
  if (!dialogFormRef.value || !formRef.value) return

  try {
    await dialogFormRef.value.validate()
    submitting.value = true
    await formRef.value.submit()
    dialogVisible.value = false
  } catch (error) {
    console.warn("[PolicyEditorValidation]", error)
  } finally {
    submitting.value = false
  }
}

const handleSuccess = () => {
  router.push("/iam/policy")
}

const handleCancel = () => {
  router.push("/iam/policy")
}
</script>

<style lang="scss" scoped>
.policy-create-page,
.policy-edit-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.page-container) {
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: none !important;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 0;
    overflow: hidden;
  }

  :deep(.manager-header) {
    flex-shrink: 0;
  }

  .scrollable-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 12px 16px;
  }
}

.policy-form-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.confirm-form-wrapper {
  padding: 8px 4px;
}

.action-btn {
  padding: 0 20px;
  border-radius: 4px;
}
</style>
