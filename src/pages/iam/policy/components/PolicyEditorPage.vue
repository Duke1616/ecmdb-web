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
          <PolicyForm
            ref="formRef"
            :is-edit="isEdit"
            :code="policyCode"
            hide-basic
            @update:submitting="submitting = $event"
            @success="handleSuccess"
          />
        </div>
      </div>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Check } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PolicyForm from "../form.vue"

const props = defineProps<{ mode: "create" | "edit" }>()

const route = useRoute()
const router = useRouter()
const formRef = ref<InstanceType<typeof PolicyForm>>()

const submitting = ref(false)

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
const submitButtonText = computed(() => (isEdit.value ? "保存修改" : "立即配置"))

const prepareSubmit = () => {
  if (!formRef.value) return

  // 交由子表单组件自行处理校验与 Dialog 弹出
  // 解决了此前父组件直接读取操作子组件状态的反模式
  formRef.value.validateAndOpenDialog()
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

.action-btn {
  padding: 0 20px;
  border-radius: 4px;
}
</style>
