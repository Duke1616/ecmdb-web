<template>
  <ProGovernanceLayout
    title="告警规则"
    subtitle="管理告警规则和规则组"
    :primary-action="{ capability: ALERT_CAPABILITIES.Rule.Add, label: '新增规则', icon: CirclePlus }"
    @primary-action="handleAddRule"
    @refresh="handleRefresh"
  >
    <template #search>
      <div class="rule-search-command">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索规则名称..."
          class="command-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </template>

    <template #actions-prefix>
      <AuthButton
        type="primary"
        class="u-gov-btn rule-group-create-btn"
        :capability="ALERT_CAPABILITIES.Rule.GroupAdd"
        disable-mode
        @click="handleAddGroup"
      >
        <el-icon><FolderAdd /></el-icon>
        <span>新增分组</span>
      </AuthButton>
    </template>

    <div class="rule-governance-container">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2 class="panel-title">规则组</h2>
          <span class="total-count">{{ ruleGroups.length }} 个分组</span>
        </div>

        <div class="group-list-container" v-loading="groupsLoading">
          <div class="group-list">
            <div class="group-list-item" :class="{ 'group-active': selectedGroup?.id === 0 }" @click="selectAllGroups">
              <div class="group-content">
                <div class="group-title">全部规则</div>
                <div class="group-badge">查看所有规则组</div>
              </div>
            </div>

            <div
              v-for="group in ruleGroups"
              :key="group.id"
              class="group-list-item"
              :class="{ 'group-active': selectedGroup?.id === group.id }"
              @click="selectGroup(group)"
            >
              <div class="group-content">
                <div class="group-title">{{ group.name }}</div>
                <div class="group-badge">{{ group.description || "规则分组" }}</div>
              </div>
              <div class="group-actions" @click.stop>
                <AuthButton
                  class="group-action-button"
                  text
                  circle
                  :icon="Edit"
                  :capability="ALERT_CAPABILITIES.Rule.GroupEdit"
                  @click="handleEditGroup(group)"
                />
                <AuthButton
                  class="group-action-button is-danger"
                  text
                  circle
                  type="danger"
                  :icon="Delete"
                  :capability="ALERT_CAPABILITIES.Rule.GroupDelete"
                  @click="handleDeleteGroup(group)"
                />
              </div>
            </div>

            <el-empty v-if="ruleGroups.length === 0 && !groupsLoading" description="暂无规则组" :image-size="80" />
          </div>
        </div>
      </aside>

      <section class="content-area">
        <div class="section-header">
          <h3 class="section-title">{{ selectedGroup?.name || "请选择规则组" }}</h3>
          <span class="section-count">{{ paginationData.total }} 条规则</span>
        </div>

        <DataTable
          :data="rules"
          :columns="columns"
          :loading="loading"
          :show-pagination="true"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          :page-sizes="paginationData.pageSizes"
          :pagination-layout="paginationData.layout"
          class="rule-table"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        >
          <template #name="{ row }">
            <div class="rule-name-cell">
              <span class="rule-name">{{ row.name }}</span>
              <span class="rule-desc">{{ row.description || "暂无描述" }}</span>
            </div>
          </template>

          <template #enabled="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" effect="light">
              {{ row.enabled ? "启用" : "禁用" }}
            </el-tag>
          </template>

          <template #level="{ row }">
            <el-tooltip :content="getLevelDescription(row.level)" placement="top">
              <el-tag :type="getLevelTagType(row.level)" effect="light">
                {{ getLevelPriority(row.level) }}
              </el-tag>
            </el-tooltip>
          </template>

          <template #datasource_type="{ row }">
            <div class="datasource-type-cell">
              <img
                :src="getDatasourceTypeIcon(row.datasource_type)"
                :alt="getDatasourceTypeName(row.datasource_type)"
                class="datasource-type-icon"
              />
              <span class="datasource-type-name">{{ getDatasourceTypeName(row.datasource_type) }}</span>
            </div>
          </template>

          <template #eval_interval="{ row }">
            <span class="interval-text">{{ formatEvalInterval(row.eval_interval) }}</span>
          </template>

          <template #workspace_count="{ row }">
            <span class="interval-text">{{ row.workspace_ids?.length || 0 }}</span>
          </template>

          <template #actions="{ row }">
            <OperateBtn :items="operateItems" :operate-item="row" :max-length="2" @route-event="handleOperateEvent" />
          </template>

          <template #empty>
            <el-empty :description="selectedGroup ? '该分组暂无规则' : '请选择左侧规则组'" :image-size="120" />
          </template>
        </DataTable>
      </section>
    </div>

    <FormDialog
      v-model="groupDialogVisible"
      :title="isEditGroup ? '编辑规则组' : '新增规则组'"
      subtitle="配置规则组的基本信息"
      width="500px"
      :header-icon="FolderAdd"
      confirm-text="保存"
      @confirm="handleGroupSubmit"
      @cancel="handleGroupDialogClosed"
      @closed="handleGroupDialogClosed"
    >
      <RuleGroupForm ref="groupFormRef" :edit-data="currentGroup" />
    </FormDialog>

    <RuleFormDrawer
      v-model="ruleDrawerVisible"
      :rule="currentRule"
      :rule-groups="ruleGroups"
      :default-group-id="selectedGroup?.id && selectedGroup.id !== 0 ? selectedGroup.id : undefined"
      @success="handleRuleFormSuccess"
    />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { CirclePlus, Delete, Edit, FolderAdd, Search } from "@element-plus/icons-vue"
import { debounce } from "lodash-es"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import { usePagination } from "@@/composables/usePagination"
import { getDatasourceTypeIcon, getDatasourceTypeName } from "@/pages/alert/utils/datasourceMeta"
import {
  createRuleGroupApi,
  deleteRuleApi,
  deleteRuleGroupApi,
  listRuleGroupsApi,
  listRulesApi,
  updateRuleGroupApi
} from "@/api/alert/rule"
import { ALERT_LEVEL_OPTIONS, type ListRulesReq, type Rule, type RuleGroup } from "@/api/alert/rule/types/rule"
import type { Column } from "@@/components/DataTable/types"
import RuleGroupForm from "./components/RuleGroupForm.vue"
import RuleFormDrawer from "./components/RuleFormDrawer.vue"

const loading = ref(false)
const groupsLoading = ref(false)
const rules = ref<Rule[]>([])
const ruleGroups = ref<RuleGroup[]>([])
const selectedGroup = ref<RuleGroup | null>(null)
const searchKeyword = ref("")
const groupDialogVisible = ref(false)
const isEditGroup = ref(false)
const currentGroup = ref<RuleGroup | null>(null)
const groupFormRef = ref<InstanceType<typeof RuleGroupForm>>()
const ruleDrawerVisible = ref(false)
const currentRule = ref<Rule | null>(null)
const { paginationData } = usePagination()

const columns: Column[] = [
  { prop: "name", label: "规则名称", minWidth: 260, slot: "name", align: "left" },
  { prop: "enabled", label: "状态", width: 110, slot: "enabled" },
  { prop: "level", label: "告警级别", width: 120, slot: "level" },
  { prop: "datasource_type", label: "数据源类型", width: 140, slot: "datasource_type" },
  { prop: "eval_interval", label: "检测频率", width: 120, slot: "eval_interval" },
  { prop: "workspace_count", label: "空间数", width: 100, slot: "workspace_count" }
]

const operateItems = computed(() => [
  {
    name: "编辑",
    code: "edit",
    type: "primary",
    icon: Edit,
    capability: ALERT_CAPABILITIES.Rule.Edit
  },
  {
    name: "删除",
    code: "delete",
    type: "danger",
    icon: Delete,
    capability: ALERT_CAPABILITIES.Rule.Delete
  }
])

const handlePageChange = (page: number) => {
  paginationData.currentPage = page
  loadRules()
}

const handlePageSizeChange = (size: number) => {
  paginationData.pageSize = size
  paginationData.currentPage = 1
  loadRules()
}

const getLevelPriority = (level: number) => {
  const option = ALERT_LEVEL_OPTIONS.find((item) => item.value === level)
  return option?.priority || ""
}

const getLevelDescription = (level: number) => {
  const option = ALERT_LEVEL_OPTIONS.find((item) => item.value === level)
  return option?.description || ""
}

const getLevelTagType = (level: number) => {
  switch (level) {
    case 1:
    case 2:
      return "danger"
    case 3:
    case 4:
      return "warning"
    default:
      return "info"
  }
}

const formatEvalInterval = (interval: number) => {
  if (interval < 60) return `${interval}秒`
  if (interval < 3600) return `${Math.floor(interval / 60)}分钟`
  return `${Math.floor(interval / 3600)}小时`
}

const loadRules = async () => {
  loading.value = true
  try {
    if (!selectedGroup.value) {
      rules.value = []
      paginationData.total = 0
      return
    }

    const params: ListRulesReq = {
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }

    if (selectedGroup.value.id !== 0) {
      params.group_id = selectedGroup.value.id
    }

    const keyword = searchKeyword.value.trim()
    if (keyword) {
      params.keyword = keyword
    }

    const { data } = await listRulesApi(params)
    paginationData.total = data.total
    rules.value = data.rules
  } catch (error) {
    console.error("加载规则列表失败:", error)
    rules.value = []
    paginationData.total = 0
  } finally {
    loading.value = false
  }
}

const loadRuleGroups = async () => {
  groupsLoading.value = true
  try {
    const { data } = await listRuleGroupsApi({ limit: 1000 })
    ruleGroups.value = data.rule_groups
  } catch (error) {
    console.error("加载规则组列表失败:", error)
    ruleGroups.value = []
  } finally {
    groupsLoading.value = false
  }
}

const selectGroup = (group: RuleGroup) => {
  selectedGroup.value = group
  paginationData.currentPage = 1
  loadRules()
}

const selectAllGroups = () => {
  selectedGroup.value = { id: 0, name: "全部规则", description: "显示所有规则组" } as RuleGroup
  paginationData.currentPage = 1
  loadRules()
}

const handleSearch = debounce(() => {
  paginationData.currentPage = 1
  loadRules()
}, 300)

const handleAddGroup = () => {
  isEditGroup.value = false
  currentGroup.value = null
  groupDialogVisible.value = true
}

const handleEditGroup = (group: RuleGroup) => {
  isEditGroup.value = true
  currentGroup.value = group
  groupDialogVisible.value = true
  nextTick(() => {
    groupFormRef.value?.setFormData(group)
  })
}

const handleDeleteGroup = async (group: RuleGroup) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则组"${group.name}"吗？删除后该组下的所有规则也将被删除。`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteRuleGroupApi(group.id)
    ElMessage.success("删除成功")
    await loadRuleGroups()

    if (selectedGroup.value?.id === group.id) {
      selectAllGroups()
    } else {
      await loadRules()
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除规则组失败:", error)
    }
  }
}

const handleGroupSubmit = async () => {
  if (!groupFormRef.value) return
  const isValid = await groupFormRef.value.submitForm()
  if (!isValid) return

  const formData = groupFormRef.value.getFormData()
  const editingGroupId = isEditGroup.value ? currentGroup.value?.id : undefined

  try {
    if (editingGroupId) {
      await updateRuleGroupApi({ id: editingGroupId, ...formData })
      ElMessage.success("更新成功")
    } else {
      await createRuleGroupApi(formData)
      ElMessage.success("创建成功")
    }

    groupDialogVisible.value = false
    await loadRuleGroups()
    if (editingGroupId && selectedGroup.value?.id === editingGroupId) {
      const latestGroup = ruleGroups.value.find((group) => group.id === editingGroupId)
      if (latestGroup) {
        selectedGroup.value = latestGroup
      }
    }
    await loadRules()
  } catch (error) {
    ElMessage.error(isEditGroup.value ? "更新失败" : "创建失败")
  }
}

const handleGroupDialogClosed = () => {
  groupDialogVisible.value = false
  isEditGroup.value = false
  currentGroup.value = null
  nextTick(() => {
    groupFormRef.value?.resetForm()
  })
}

const handleAddRule = () => {
  if (!selectedGroup.value) {
    ElMessage.warning("请先选择规则组")
    return
  }
  currentRule.value = null
  ruleDrawerVisible.value = true
}

const handleEdit = (rule: Rule) => {
  currentRule.value = rule
  ruleDrawerVisible.value = true
}

const handleDelete = async (rule: Rule) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则 "${rule.name}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await deleteRuleApi(rule.id)
    ElMessage.success("删除成功")
    loadRules()
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除规则失败:", error)
      ElMessage.error("删除失败")
    }
  }
}

const handleOperateEvent = (row: Rule, action: string) => {
  if (action === "edit") {
    handleEdit(row)
  } else if (action === "delete") {
    handleDelete(row)
  }
}

const handleRuleFormSuccess = () => {
  loadRules()
  loadRuleGroups()
}

const handleRefresh = () => {
  loadRuleGroups()
  loadRules()
}

watch(searchKeyword, () => {
  handleSearch()
})

onMounted(async () => {
  await loadRuleGroups()
  selectAllGroups()
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
  gap: clamp(16px, 1.4vw, 24px);
  padding: clamp(16px, 1.4vw, 22px) clamp(18px, 1.6vw, 24px);
}

:deep(.header-left) {
  flex: 0 0 auto;
  min-width: clamp(240px, 20vw, 320px);
}

:deep(.header-right) {
  flex: 1;
  min-width: 0;
}

:deep(.eiam-governance-bar) {
  width: 100%;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: clamp(12px, 1.2vw, 18px);
}

:deep(.action-group) {
  flex-shrink: 0;
  gap: 10px;
}

.rule-search-command {
  display: flex;
  align-items: center;
  flex: 0 1 340px;
  min-width: 220px;
  height: 38px;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  .command-input {
    width: 100%;

    :deep(.el-input__wrapper) {
      padding: 0;
      background: transparent;
      box-shadow: none !important;
    }
  }

  .search-icon {
    color: #94a3b8;
    font-size: 16px;
  }
}

.rule-group-create-btn {
  height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  font-weight: 600;
}

.rule-governance-container {
  --catalog-sidebar-width: clamp(292px, 18vw, 320px);
  --catalog-panel-gap: clamp(12px, 1vw, 18px);
  --catalog-panel-pad: clamp(14px, 1.1vw, 18px);

  display: flex;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.sidebar {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: var(--catalog-sidebar-width);
  min-width: var(--catalog-sidebar-width);
  overflow: hidden;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
}

.sidebar-header,
.section-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.panel-title,
.section-title {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
}

.total-count,
.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.total-count {
  color: #475569;
  background: #e2e8f0;
}

.section-count {
  color: #075985;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
}

.group-list-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100%;
  padding: 14px;
}

.group-list-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 72px;
  padding: 14px 14px 14px 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::before {
    position: absolute;
    top: 12px;
    bottom: 12px;
    left: 0;
    width: 3px;
    content: "";
    background: transparent;
    border-radius: 0 999px 999px 0;
  }

  &:hover {
    background: #f8fafc;
    border-color: #bfdbfe;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);

    .group-actions {
      opacity: 1;
    }
  }

  &.group-active {
    background: #eff6ff;
    border-color: #93c5fd;
    box-shadow: 0 8px 18px rgba(14, 165, 233, 0.12);

    &::before {
      background: #0ea5e9;
    }

    .group-title {
      color: #0f172a;
    }

    .group-badge {
      color: #0369a1;
    }
  }
}

.group-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
}

.group-title {
  overflow: hidden;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-badge {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.group-action-button {
  width: 28px;
  height: 28px;
  color: #2563eb;

  &:hover {
    background: #dbeafe;
  }

  &.is-danger {
    color: #dc2626;

    &:hover {
      background: #fee2e2;
    }
  }
}

.content-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
}

.rule-table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;

  :deep(.manager-content) {
    flex: 1;
    min-height: 0;
  }

  :deep(.content-card) {
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  :deep(.el-table__header th:first-child .cell) {
    justify-content: flex-start;
  }
}

.rule-name-cell {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.rule-name {
  max-width: 100%;
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-desc {
  max-width: 100%;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.interval-text {
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.datasource-type-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}

.datasource-type-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
}

.datasource-type-name {
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .rule-governance-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    min-width: 0;
    max-height: 240px;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .group-list {
    flex-direction: row;
    overflow-x: auto;
  }

  .group-list-item {
    min-width: 190px;
  }

  .group-actions {
    opacity: 1;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
  }
}

@media (max-width: 520px) {
  .rule-search-command {
    width: 100%;
    min-width: 0;
  }

  :deep(.action-group) {
    width: 100%;
    flex-wrap: wrap;
  }
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
  }
}
</style>
