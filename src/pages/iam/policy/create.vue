<template>
  <div class="policy-create-page">
    <PageContainer>
      <!-- 页面头部 -->
      <ManagerHeader
        title="创建策略"
        subtitle="定义访问控制策略与权限语句"
        :show-back-button="true"
        :show-add-button="false"
        :show-refresh-button="false"
        :sticky="true"
        @back="handleCancel"
      >
        <template #actions>
          <el-button @click="handleCancel" class="action-btn">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit" class="action-btn">
            <el-icon><Check /></el-icon>
            立即创建
          </el-button>
        </template>
      </ManagerHeader>

      <!-- 可滚动内容区域 -->
      <div class="scrollable-content">
        <div class="policy-form-container">
          <PolicyForm ref="formRef" :is-edit="false" @success="handleSuccess" @cancel="handleCancel" />
        </div>
      </div>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { Check } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PolicyForm from "./form.vue"

const router = useRouter()
const formRef = ref<InstanceType<typeof PolicyForm>>()
const submitting = ref(false)

const handleSubmit = async () => {
  submitting.value = true
  try {
    await formRef.value?.submit()
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
.policy-create-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.page-container) {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: calc(1rem + 0.4vw);
  }
}

.policy-form-container {
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
}

.action-btn {
  padding-left: 20px;
  padding-right: 20px;
  border-radius: 6px;
}
</style>
