<template>
  <GenericPicker
    v-model="model"
    :placeholder="placeholder"
    search-placeholder="搜索流程..."
    :variant="variant"
    :search-api="searchApi"
    :resolve-api="resolveApi"
    key-field="id"
    label-field="name"
    container-class="workflow-picker"
    dropdown-class="workflow-picker-dropdown"
    :page-size="10"
    :show-pagination="true"
    :fallback-builder="fallbackBuilder"
  >
    <template #single="{ item }">
      <span class="workflow-name">{{ item.name }}</span>
    </template>

    <template #item="{ item }">
      <div class="workflow-icon">{{ getInitial(item.name) }}</div>
      <div class="workflow-info">
        <div class="workflow-name">{{ item.name }}</div>
        <div class="workflow-desc">{{ item.desc || `流程 #${item.id}` }}</div>
      </div>
    </template>
  </GenericPicker>
</template>

<script setup lang="ts">
import GenericPicker from "@/common/components/GenericPicker/index.vue"
import { getWorkflowDetailApi, listWorkflowsByKeywordApi } from "@/api/ticket/workflow/workflow"
import type { Workflow } from "@/api/ticket/workflow/types/workflow"

interface WorkflowPickerProps {
  placeholder?: string
  variant?: "fancy" | "simple" | "element"
}

withDefaults(defineProps<WorkflowPickerProps>(), {
  placeholder: "请选择流程",
  variant: "element"
})

const model = defineModel<number>()

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const { data } = await listWorkflowsByKeywordApi({
    keyword: params.keyword,
    offset: params.offset,
    limit: params.limit
  })

  return {
    total: data.total || 0,
    data: data.workflows || []
  }
}

const resolveApi = async (id: number): Promise<Workflow | null> => {
  const { data } = await getWorkflowDetailApi(id)
  return data
}

const fallbackBuilder = (id: number): Workflow => ({
  id,
  template_id: 0,
  name: `流程 #${id}`,
  desc: "",
  owner: "",
  icon: "",
  is_notify: false,
  notify_method: 0
})

const getInitial = (name: string) => name.trim().charAt(0) || "流"
</script>

<style scoped lang="scss">
.workflow-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 13px;
  font-weight: 700;
  color: #606266;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
}

.workflow-name {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 400;
  color: #606266;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.workflow-desc {
  max-width: 100%;
  overflow: hidden;
  font-size: 11px;
  color: #6b7280;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.workflow-picker.variant-simple .picker-input-box) {
  min-height: 32px;
  background: #ffffff !important;
  border: 1px solid #dcdfe6 !important;
  box-shadow: none !important;
}

:deep(.workflow-picker.variant-simple .picker-input-box:hover) {
  border-color: #c0c4cc !important;
  box-shadow: none !important;
}

:deep(.workflow-picker.variant-simple .picker-input-box.is-focus) {
  border-color: #dcdfe6 !important;
  box-shadow: none !important;
}

:global(.workflow-picker-dropdown .search-input:focus) {
  border-color: #c0c4cc;
  box-shadow: none;
}

:global(.workflow-picker-dropdown .list-item:hover) {
  background: #f5f7fa;
}

:global(.workflow-picker-dropdown .list-item.is-selected) {
  background: #f5f7fa;
}

:global(.workflow-picker-dropdown .list-item.is-selected .workflow-icon) {
  color: #303133;
  background: #ffffff;
  border-color: #c0c4cc;
}

:global(.workflow-picker-dropdown .selected-indicator) {
  color: #606266;
}

:global(.workflow-picker-dropdown .el-pagination.is-background .el-pager li.is-active) {
  background-color: #606266;
}
</style>
