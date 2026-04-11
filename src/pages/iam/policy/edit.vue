<template>
  <div class="policy-edit-page">
    <PageContainer>
      <ManagerHeader
        :title="`编辑策略: ${policyName}`"
        subtitle="修改权限语句定义，系统将自动同步变更"
        :show-back-button="true"
        :show-add-button="false"
        :show-refresh-button="false"
        :sticky="true"
        @back="handleCancel"
      >
        <template #actions>
          <el-button @click="handleCancel" class="action-btn">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="prepareSubmit" class="action-btn">
            <el-icon><Check /></el-icon>
            保存修改
          </el-button>
        </template>
      </ManagerHeader>

      <div class="scrollable-content">
        <div class="policy-form-container">
          <PolicyForm ref="formRef" is-edit :id="policyId" hide-basic @success="handleSuccess" />
        </div>
      </div>

      <!-- 确认修改弹窗 -->
      <FormDialog
        v-model="dialogVisible"
        title="确认策略信息"
        subtitle="您可以修改策略名称或描述，识别码 (Code) 通常不建议变更"
        header-icon="EditPen"
        width="500px"
        confirm-text="确认并保存"
        @confirm="handleFinalSubmit"
        @cancel="dialogVisible = false"
      >
        <div class="confirm-form-wrapper">
          <el-form ref="dialogFormRef" :model="formRef?.formData" :rules="formRef?.formRules" label-position="top">
            <el-form-item label="策略名称" prop="name">
              <el-input v-model="formRef!.formData.name" />
            </el-form-item>
            <el-form-item label="策略识别码 (Code)" prop="code">
              <el-input v-model="formRef!.formData.code" disabled />
            </el-form-item>
            <el-form-item label="策略描述" prop="desc">
              <el-input v-model="formRef!.formData.desc" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
        </div>
      </FormDialog>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Check } from "@element-plus/icons-vue"
import { ElMessage, type FormInstance } from "element-plus"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import PolicyForm from "./form.vue"
import { getPolicyDetailApi } from "@/api/iam/policy"

const route = useRoute()
const router = useRouter()
const formRef = ref<InstanceType<typeof PolicyForm>>()
const dialogFormRef = ref<FormInstance>()

const submitting = ref(false)
const dialogVisible = ref(false)
const policyId = route.query.id as string

const policyName = computed(() => formRef.value?.formData?.name || "...")

const prepareSubmit = () => {
  if (!formRef.value) return
  const formData = formRef.value.formData
  if (!formData.statement || formData.statement.length === 0) {
    return ElMessage.warning("请至少保留一条权限语句")
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
  } catch (e) {
    console.warn("[Validation]", e)
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

onMounted(async () => {
  if (policyId && formRef.value) {
    try {
      const { data } = await getPolicyDetailApi(policyId)
      formRef.value.setForm(data)
    } catch (e) {
      ElMessage.error("获取策略详情失败")
    }
  }
})
</script>

<style lang="scss" scoped>
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
