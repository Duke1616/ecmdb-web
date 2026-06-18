<template>
  <ProGovernanceLayout
    title="模板管理"
    subtitle="管理系统模板和分组"
    :primary-action="{ label: '新增模板', icon: CirclePlus, capability: TICKET_CAPABILITIES.Template.Add }"
    :secondary-action="{ label: '新增分组', icon: CirclePlus, capability: TICKET_CAPABILITIES.Template.AddGroup }"
    :show-refresh="canViewTemplate"
    @primary-action="handleCreateTemplate"
    @secondary-action="openGroupDialog"
    @refresh="refreshTemplateManageData"
  >
    <div v-if="!canViewTemplate" class="template-empty">
      <el-empty :image-size="160" description="您没有权限查看模板管理" />
    </div>

    <div v-else class="template-manage-layout">
      <TemplateGroupSidebar
        v-model:selected-group="selectedGroup"
        :groups="templateGroups"
        :total-count="totalTemplateCount"
        :loading="groupLoading"
        @edit-group="openEditGroupDialog"
        @delete-group="handleDeleteTemplateGroup"
      />

      <section class="template-list-panel">
        <TemplateTable
          :data="templatesData"
          :columns="templateColumns"
          :pagination-data="paginationData"
          :loading="loading"
          :format-workflow="formatWorkflow"
          :get-operate-items="getOperateBtnItems"
          @selection-change="handleSelectionChange"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          @operate="operateEvent"
        />
      </section>
    </div>

    <TemplateEditor
      v-model="templateEditorVisible"
      v-model:step="templateEditorStep"
      :form-data="templateFormData"
      @update:form-data="updateTemplateFormData"
      @close="onClosedTemplate"
      @save="saveTemplate"
    />

    <FormDialog
      v-model="groupDialogVisible"
      :title="groupDialogTitle"
      width="560px"
      @confirm="handleCreateTemplateGroup"
      @cancel="onClosedTemplateGroup"
    >
      <TemplateGroupForm ref="groupFormRef" @closed="onClosedTemplateGroup" @success="handleGroupSuccess" />
    </FormDialog>

    <FormDialog
      v-model="thirdpartyDialogVisible"
      title="绑定第三方流程"
      width="35%"
      @confirm="handleCreateThirdParty"
      @cancel="onClosedThirdParty"
    >
      <TemplateThirdPartyForm ref="thirdPartyFormRef" @closed="onClosedThirdParty" @success="handleThirdPartySuccess" />
    </FormDialog>
  </ProGovernanceLayout>
</template>

<script lang="ts" setup>
import { computed } from "vue"
import { CirclePlus } from "@element-plus/icons-vue"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import { FormDialog } from "@@/components/Dialogs"
import TemplateEditor from "./components/TemplateEditor.vue"
import TemplateGroupForm from "./components/TemplateGroupForm.vue"
import TemplateGroupSidebar from "./components/TemplateGroupSidebar.vue"
import TemplateTable from "./components/TemplateTable.vue"
import TemplateThirdPartyForm from "./components/TemplateThirdPartyForm.vue"
import { templateColumns } from "./composables/useTemplateColumns"
import { useTemplateActions } from "./composables/useTemplateActions"
import { useTemplateList } from "./composables/useTemplateList"
import { useTemplateWizard } from "./composables/useTemplateWizard"

const { hasPermission } = usePermission()
const canViewTemplate = computed(() => hasPermission(TICKET_CAPABILITIES.Template.View))

const {
  templatesData,
  templateGroups,
  selectedGroup,
  totalTemplateCount,
  loading,
  groupLoading,
  paginationData,
  refreshTemplateManageData,
  formatWorkflow,
  handleSelectionChange,
  handleCurrentChange,
  handleSizeChange
} = useTemplateList()

const {
  templateEditorVisible,
  templateEditorStep,
  templateFormData,
  handleCreateTemplate,
  handleUpdateTemplate,
  handleCloneTemplate,
  updateTemplateFormData,
  onClosedTemplate,
  saveTemplate
} = useTemplateWizard({
  refresh: refreshTemplateManageData
})

const {
  groupDialogVisible,
  groupDialogTitle,
  thirdpartyDialogVisible,
  groupFormRef,
  thirdPartyFormRef,
  getOperateBtnItems,
  openGroupDialog,
  openEditGroupDialog,
  onClosedTemplateGroup,
  handleGroupSuccess,
  handleCreateTemplateGroup,
  handleDeleteTemplateGroup,
  onClosedThirdParty,
  handleThirdPartySuccess,
  handleCreateThirdParty,
  operateEvent
} = useTemplateActions({
  refresh: refreshTemplateManageData,
  handleUpdateTemplate,
  handleCloneTemplate
})
</script>

<style scoped lang="scss">
:deep(.pro-gov-content) {
  display: flex;
  flex: 1;
  min-height: 0;
}

.template-empty {
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.template-manage-layout {
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.template-list-panel {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

.template-list-panel :deep(.manager-content) {
  min-height: 0;
}

.template-list-panel :deep(.content-card) {
  border: none;
  border-radius: 0;
  box-shadow: none;
}

@media (max-width: 768px) {
  .template-manage-layout {
    flex-direction: column;
    overflow-y: auto;
  }
}
</style>
