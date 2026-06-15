<template>
  <ProGovernanceLayout
    title="模型管理"
    subtitle="管理 CMDB 模型定义、分组结构与资产规模"
    v-model:keyword="searchInput"
    :primary-action="{ capability: CMDB_CAPABILITIES.Model.Create, label: '新增模型', icon: CirclePlus }"
    @refresh="getModelsData"
    @primary-action="openModelDialog"
  >
    <template #search>
      <ModelSearchCommand v-model:keyword="searchInput" v-model:status="modelStatus" />
    </template>

    <template #actions-prefix>
      <AuthButton
        type="success"
        class="u-gov-btn model-group-create-btn"
        :capability="CMDB_CAPABILITIES.Model.GroupCreate"
        disable-mode
        @click="openGroupDialog"
      >
        <el-icon><FolderAdd /></el-icon>
        <span>新建分组</span>
      </AuthButton>
    </template>

    <el-empty v-if="empty" :image-size="180" description="暂无模型数据" class="model-empty" />

    <ModelCatalogPanel
      v-else
      :groups="filterData"
      :selected-group="selectedGroup"
      :can-view-model-detail="canViewModelDetail"
      :can-delete-model-group="canDeleteModelGroup"
      @select-group="selectGroup"
      @delete-group="handleDeleteModelGroup"
      @model-click="handleModelClick"
    />

    <FormDialog
      v-model="dialogModelVisible"
      title="新增模型"
      subtitle="创建新的CMDB模型"
      width="500px"
      header-icon="Document"
      @closed="resetForm"
      @confirm="handleCreateModel"
      @cancel="dialogModelVisible = false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="top">
        <el-form-item prop="group_id" label="所属分组">
          <el-select v-model="formData.group_id" placeholder="请选择">
            <el-option
              v-for="item in modelsData"
              :key="item.group_id"
              :label="item.group_name"
              :value="item.group_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="uid" label="唯一标识">
          <el-input v-model="formData.uid" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item prop="name" label="名称">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item prop="icon" label="图标选择">
          <CustomIconSelect v-model="formData.iconData" iconType="cmdb" @change="handleIconChange" />
        </el-form-item>
      </el-form>
    </FormDialog>

    <FormDialog
      v-model="dialogModelGroupVisible"
      title="新增分组"
      subtitle="创建新的模型分组"
      width="500px"
      header-icon="Folder"
      @closed="resetForm"
      @confirm="handleCreateModelGroup"
      @cancel="dialogModelGroupVisible = false"
    >
      <el-form
        ref="formGroupRef"
        :model="formModelGroupData"
        :rules="groupFormRules"
        label-width="100px"
        label-position="top"
      >
        <el-form-item prop="name" label="名称">
          <el-input v-model="formModelGroupData.name" placeholder="请输入名称" />
        </el-form-item>
      </el-form>
    </FormDialog>
  </ProGovernanceLayout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue"
import { CirclePlus, FolderAdd } from "@element-plus/icons-vue"
import CustomIconSelect from "@/common/components/CustomIconSelect/index.vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { FormDialog } from "@@/components/Dialogs"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import ModelCatalogPanel from "./components/ModelCatalogPanel.vue"
import ModelSearchCommand from "./components/ModelSearchCommand.vue"
import { useModelCatalog } from "./composables/useModelCatalog"
import { useModelCreateForms } from "./composables/useModelCreateForms"

const {
  searchInput,
  modelStatus,
  modelsData,
  filterData,
  empty,
  selectedGroup,
  canViewModelDetail,
  canDeleteModelGroup,
  selectGroup,
  getModelsData,
  handleDeleteModelGroup,
  handleModelClick
} = useModelCatalog()

const {
  dialogModelVisible,
  dialogModelGroupVisible,
  formData,
  formModelGroupData,
  formRef,
  formGroupRef,
  formRules,
  groupFormRules,
  openModelDialog,
  openGroupDialog,
  handleIconChange,
  resetForm,
  handleCreateModel,
  handleCreateModelGroup
} = useModelCreateForms(getModelsData)

onMounted(() => {
  getModelsData()
})
</script>

<style lang="scss" scoped>
:deep(.pro-gov-content) {
  display: flex;
  flex: 1;
  min-height: 0;
}

:deep(.manager-header) {
  align-items: center;
  gap: 24px;
  padding: 22px 24px;
}

:deep(.header-left) {
  flex: 0 0 auto;
  min-width: 330px;
}

:deep(.header-right) {
  flex: 1;
  min-width: 0;
}

:deep(.eiam-governance-bar) {
  width: 100%;
  justify-content: flex-end;
  gap: 20px;
}

:deep(.action-group) {
  flex-shrink: 0;
  gap: 10px;
}

.model-group-create-btn {
  height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  font-weight: 600;
}

.model-empty {
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

@media (max-width: 1100px) {
  :deep(.manager-header) {
    align-items: stretch;
    flex-direction: column;
  }

  :deep(.header-left) {
    min-width: 0;
  }

  :deep(.eiam-governance-bar) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  :deep(.action-group) {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
