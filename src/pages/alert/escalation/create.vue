<template>
  <div class="escalation-create-page">
    <PageContainer>
      <!-- 页面头部 -->
      <ManagerHeader
        title="创建升级配置"
        subtitle="配置消息升级规则和触发条件"
        :show-back-button="true"
        :show-add-button="false"
        :show-refresh-button="false"
        :sticky="true"
        @back="handleCancel"
      >
        <template #actions>
          <el-button type="primary" @click="handleSubmit" class="action-btn" :loading="saving">
            <el-icon><Check /></el-icon>
            创建配置
          </el-button>
        </template>
      </ManagerHeader>

      <!-- 可滚动内容区域 -->
      <div class="scrollable-content">
        <!-- 表单内容 -->
        <div class="escalation-form-container">
          <EscalationConfigForm ref="formRef" v-model="formData" @submit="handleSubmit" @cancel="handleCancel" />
        </div>
      </div>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { Check } from "@element-plus/icons-vue"
import type { CreateConfigReq } from "@/api/alert/escalation/types"
import { ESCALATION_LOGIC_TYPES } from "@/api/alert/escalation/types"
import EscalationConfigForm from "./components/EscalationConfigForm.vue"
import { createConfigApi } from "@/api/alert/escalation"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"

const router = useRouter()

// 保存状态
const saving = ref(false)

// 表单数据
const formData = ref<CreateConfigReq>({
  biz_id: 1, // 默认业务ID，实际应该从路由参数或用户信息获取
  key: "",
  name: "",
  description: "",
  enabled: true,
  timeout: 300000, // 5分钟，单位毫秒
  triggers: [],
  trigger_logic: {
    type: ESCALATION_LOGIC_TYPES.ALL,
    expression: "",
    description: ""
  },
  steps: [],
  created_by: "admin" // 实际应该从用户信息获取
})

// 表单引用
const formRef = ref()

// 提交表单
const handleSubmit = async () => {
  try {
    saving.value = true

    // 先进行表单验证
    const isValid = await formRef.value?.validateForm()
    if (!isValid) {
      return
    }

    await createConfigApi(formData.value)
    ElMessage.success("创建成功")
    router.push({ name: "EscalationConfig" })
  } catch (error) {
    console.error("创建配置失败:", error)
    ElMessage.error("创建失败，请重试")
  } finally {
    saving.value = false
  }
}

// 取消创建
const handleCancel = () => {
  ElMessageBox.confirm("确定要离开吗？未保存的数据将丢失。", "确认离开", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      router.push({ name: "EscalationConfig" })
    })
    .catch(() => {
      // 用户取消
    })
}
</script>

<style lang="scss" scoped>
.escalation-create-page {
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

.escalation-form-container {
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
}

:deep(.el-form-item) {
  margin-bottom: 1.5rem;

  .el-form-item__label {
    font-weight: 500;
    color: #374151;
  }

  .el-input__wrapper {
    border-radius: 0.5rem;
  }

  .el-textarea__inner {
    border-radius: 0.5rem;
    resize: none;
  }

  .el-select {
    .el-input__wrapper {
      border-radius: 0.5rem;
    }
  }
}
</style>
