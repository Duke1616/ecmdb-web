<template>
  <div class="workflow-page">
    <ProGovernanceLayout
      v-show="isListVisible"
      title="流程管理"
      subtitle="管理工作流程和部署"
      :primary-action="{
        label: '新增流程',
        icon: CirclePlus,
        capability: TICKET_CAPABILITIES.Workflow.Add
      }"
      @primary-action="openCreate"
      @refresh="listWorkflowsData"
    >
      <el-empty v-if="!canViewWorkflow" class="workflow-empty" description="您没有权限查看流程管理" />
      <WorkflowTable
        v-else
        :data="workflowsData"
        :pagination-data="paginationData"
        :loading="loading"
        :format-owner="formatOwner"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        @operate="operateEvent"
      />
    </ProGovernanceLayout>

    <WizardContainer
      v-if="isWizardVisible"
      ref="workflowWizardRef"
      :steps="workflowSteps"
      :form-data="workflowFormData"
      :form-rules="workflowFormRules"
      @update:form-data="updateWorkflowFormData"
      @close="closeWizard"
      @save="saveWorkflow"
    />

    <el-dialog v-model="previewVisible" width="60%" @closed="closePreview" @opened="handlePreviewOpened">
      <WorkflowPreview ref="previewRef" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue"
import { CirclePlus } from "@element-plus/icons-vue"
import WizardContainer from "@/common/components/WizardContainer/index.vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { COMMON_STEPS } from "@/common/constants/wizard-steps"
import WorkflowDesigner from "./components/WorkflowDesigner.vue"
import WorkflowInfoForm from "./components/WorkflowInfoForm.vue"
import WorkflowPreview from "./components/WorkflowPreview.vue"
import WorkflowSettingForm from "./components/WorkflowSettingForm.vue"
import WorkflowTable from "./components/WorkflowTable.vue"
import { useWorkflowActions } from "./composables/useWorkflowActions"
import { useWorkflowList } from "./composables/useWorkflowList"
import { useWorkflowWizard } from "./composables/useWorkflowWizard"

const { hasPermission } = usePermission()
const canViewWorkflow = computed(() => hasPermission(TICKET_CAPABILITIES.Workflow.View))
const previewRef = ref<InstanceType<typeof WorkflowPreview>>()

const {
  paginationData,
  handleCurrentChange,
  handleSizeChange,
  workflowsData,
  loading,
  listWorkflowsData,
  formatOwner
} = useWorkflowList()

const {
  workflowWizardRef,
  workflowFormData,
  workflowFormRules,
  isListVisible,
  isWizardVisible,
  showWizard,
  openCreate,
  closeWizard,
  updateWorkflowFormData,
  saveWorkflow
} = useWorkflowWizard({ refresh: listWorkflowsData })

const { previewVisible, previewData, operateEvent, closePreview } = useWorkflowActions({
  refresh: listWorkflowsData,
  showWizard
})

const workflowSteps = [
  {
    ...COMMON_STEPS.INFO,
    title: "填写流程信息",
    component: WorkflowInfoForm
  },
  {
    ...COMMON_STEPS.DESIGN,
    title: "定义配置流程",
    description: "可视化流程设计",
    component: WorkflowDesigner
  },
  {
    ...COMMON_STEPS.SETTING,
    title: "配置启动设置",
    description: "通知和参数配置",
    component: WorkflowSettingForm
  }
]

const handlePreviewOpened = () => {
  if (previewRef.value && previewData.value) {
    previewRef.value.initLf(previewData.value)
  }
}
</script>

<style lang="scss" scoped>
.workflow-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.workflow-empty {
  flex: 1;
  min-height: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
