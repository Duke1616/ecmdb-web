<template>
  <ProGovernanceLayout
    title="模板管理"
    subtitle="管理系统模板和分组"
    :primary-action="{ label: '新增模板', icon: CirclePlus, capability: TICKET_CAPABILITIES.Template.Add }"
    :secondary-action="{ label: '新增分组', icon: CirclePlus, capability: TICKET_CAPABILITIES.Template.AddGroup }"
    :show-refresh="canViewTemplate"
    @primary-action="handleCreateTemplate"
    @secondary-action="openGroupDialog"
    @refresh="listTemplatesData"
  >
    <TemplateTable
      :data="templatesData"
      :columns="templateColumns"
      :pagination-data="paginationData"
      :loading="loading"
      :format-group="formatGroup"
      :get-operate-items="getOperateBtnItems"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      @operate="operateEvent"
    />

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
      title="新增模板分组"
      width="30%"
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
  loading,
  paginationData,
  listTemplatesData,
  formatGroup,
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
  refresh: listTemplatesData
})

const {
  groupDialogVisible,
  thirdpartyDialogVisible,
  groupFormRef,
  thirdPartyFormRef,
  getOperateBtnItems,
  openGroupDialog,
  onClosedTemplateGroup,
  handleGroupSuccess,
  handleCreateTemplateGroup,
  onClosedThirdParty,
  handleThirdPartySuccess,
  handleCreateThirdParty,
  operateEvent
} = useTemplateActions({
  refresh: listTemplatesData,
  handleUpdateTemplate,
  handleCloneTemplate
})
</script>
