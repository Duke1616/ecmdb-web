<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="分发规则" subtitle="管理告警分发规则" @refresh="loadRules">
      <template #actions>
        <div class="filter-actions">
          <el-select v-model="scopeFilter" placeholder="筛选作用域" class="filter-item" clearable>
            <el-option label="全局" :value="DispatchScope.Global" />
            <el-option label="规则" :value="DispatchScope.Rule" />
          </el-select>
          <el-select v-model="matchTypeFilter" placeholder="筛选类型" class="filter-item" clearable>
            <el-option label="路由分发" :value="DispatchMatchType.Routing" />
            <el-option label="创建工单" :value="DispatchMatchType.Ticket" />
          </el-select>
          <div v-if="scopeFilter === DispatchScope.Rule" class="filter-item rule-filter">
            <RuleSelector v-model="ruleFilter" placeholder="筛选关联规则" variant="simple" />
          </div>
          <el-button type="primary" :icon="Search" class="action-btn" @click="handleSearch"> 搜索 </el-button>
          <el-button type="primary" :icon="Plus" class="action-btn" @click="handleCreate"> 添加规则 </el-button>
        </div>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="rules"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="false"
      :enable-row-drag="true"
      v-loading="loading"
      @row-drag="handleRowDrag"
    >
      <!-- 规则名称插槽 -->
      <template #name="{ row }">
        <div class="name-cell">
          <h4 class="rule-name">{{ row.name }}</h4>
        </div>
      </template>

      <!-- 描述插槽 -->
      <template #description="{ row }">
        <div class="description-cell">
          <p class="rule-description">{{ row.description || "暂无描述" }}</p>
        </div>
      </template>

      <!-- 作用域插槽 -->
      <template #scope="{ row }">
        <el-tag :type="row.scope === 'global' ? 'primary' : 'warning'" size="small">
          {{ row.scope === "global" ? "全局" : "规则" }}
        </el-tag>
      </template>

      <!-- 匹配类型插槽 -->
      <template #matchType="{ row }">
        <el-tag :type="row.match_type === 'routing' ? 'success' : 'info'" size="small">
          {{ row.match_type === "routing" ? "路由分发" : "创建工单" }}
        </el-tag>
      </template>

      <!-- 状态插槽 -->
      <template #enabled="{ row }">
        <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
          {{ row.enabled ? "已启用" : "已禁用" }}
        </el-tag>
      </template>

      <!-- 目标工作空间插槽 -->
      <template #workspace="{ row }">
        <div class="workspace-cell">
          <el-tag v-if="row.workspace_id" type="primary" size="small">
            {{ getWorkspaceName(row.workspace_id) }}
          </el-tag>
          <span v-else class="text-placeholder">-</span>
        </div>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="operateEvent" />
      </template>
    </DataTable>

    <!-- 创建/编辑抽屉 -->
    <Drawer
      v-model="drawerVisible"
      :title="isEdit ? '编辑分发规则' : '添加分发规则'"
      :subtitle="isEdit ? '修改分发规则配置' : '配置告警分发规则'"
      header-icon="Setting"
      size="35%"
      :confirm-loading="submitting"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    >
      <DispatchForm
        v-if="Object.keys(formData).length > 0"
        ref="dispatchFormRef"
        v-model:form-data="formData"
        :is-edit="isEdit"
      />
    </Drawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus, Search } from "@element-plus/icons-vue"
import type { DispatchRule, SaveDispatchRuleReq } from "@/api/alert/dispatch/types"
import { DispatchScope, DispatchMatchType } from "@/api/alert/dispatch/types"
import type { Workspace } from "@/api/alert/workspace/types"
import {
  createDispatchRuleApi,
  updateDispatchRuleApi,
  deleteDispatchRuleApi,
  toggleDispatchRuleStatusApi,
  findMatchingRulesApi,
  swapPrioritiesApi
} from "@/api/alert/dispatch/index"
import { listWorkspacesApi } from "@/api/alert/workspace"
import { useDispatchUtils } from "./composables/useDispatchUtils"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import { Drawer } from "@@/components/Dialogs"
import DispatchForm from "./components/DispatchForm.vue"
import RuleSelector from "@@/components/RuleSelector/index.vue"

// 使用工具函数
const { createEmptyFormData, convertRuleToFormData } = useDispatchUtils()

// 响应式数据
const loading = ref(false)
const allRules = ref<DispatchRule[]>([]) // 存储所有规则
const currentRule = ref<DispatchRule | null>(null)
const drawerVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formData = ref<SaveDispatchRuleReq>(createEmptyFormData())
const workspaces = ref<Workspace[]>([]) // 工作空间列表
const dispatchFormRef = ref<InstanceType<typeof DispatchForm>>()

// 筛选条件（用户输入）
const scopeFilter = ref(DispatchScope.Global)
const matchTypeFilter = ref(DispatchMatchType.Routing)
const ruleFilter = ref<number>(0)

// 执行搜索（公共函数）
const performSearch = async () => {
  try {
    loading.value = true

    // 构建搜索条件
    const scopes: string[] = []
    if (scopeFilter.value === DispatchScope.Global) {
      scopes.push("global")
    } else if (scopeFilter.value === DispatchScope.Rule) {
      scopes.push("rule")
    } else {
      // 没有选择时，搜索全部
      scopes.push("global")
    }

    const searchParams = {
      scopes,
      match_type: matchTypeFilter.value || "routing",
      rule_id: scopeFilter.value === DispatchScope.Rule && ruleFilter.value ? ruleFilter.value : 0
    }

    const response = await findMatchingRulesApi(searchParams)
    allRules.value = Array.isArray(response.data.dispatch_rules) ? response.data.dispatch_rules : []
  } catch (error) {
    console.error("搜索分发规则失败:", error)
    allRules.value = []
  } finally {
    loading.value = false
  }
}

// 点击搜索按钮
const handleSearch = () => {
  performSearch()
}

// 加载工作空间列表
const loadWorkspaces = async () => {
  try {
    const response = await listWorkspacesApi({ offset: 0, limit: 0 })
    workspaces.value = response.data.workspaces
  } catch (error) {
    console.error("加载工作空间列表失败:", error)
  }
}

// 获取工作空间名称
const getWorkspaceName = (workspaceId: number) => {
  // 如果是 0 或者无效值，返回 "-"
  if (!workspaceId || workspaceId === 0) {
    return "-"
  }
  const workspace = workspaces.value.find((w) => w.id === workspaceId)
  return workspace?.name || `工作空间 ${workspaceId}`
}

// 表格列配置
const tableColumns = [
  { prop: "name", label: "规则名称", minWidth: 120, slot: "name" },
  { prop: "description", label: "描述", minWidth: 150, slot: "description" },
  { prop: "scope", label: "作用域", minWidth: 100, slot: "scope" },
  { prop: "match_type", label: "类型", minWidth: 100, slot: "matchType" },
  { prop: "enabled", label: "状态", minWidth: 80, slot: "enabled" },
  { prop: "workspace_id", label: "目标工作空间", minWidth: 120, slot: "workspace" }
]

// 直接使用后端返回的规则列表
const rules = computed(() => allRules.value)

// 获取操作按钮配置
const getOperateItems = (row: DispatchRule) => {
  const items = [
    {
      name: "编辑",
      code: "edit",
      type: "primary",
      icon: "Edit"
    },
    {
      name: row.enabled ? "禁用" : "启用",
      code: "toggle",
      type: row.enabled ? "warning" : "success",
      icon: "Refresh"
    },
    {
      name: "删除",
      code: "delete",
      type: "danger",
      icon: "Delete"
    }
  ]
  return items
}

// 加载规则列表（初始化时调用）
const loadRules = async () => {
  await performSearch()
}

// 初始化页面数据
const initPageData = async () => {
  await Promise.all([loadWorkspaces(), loadRules()])
}

// 创建规则
const handleCreate = () => {
  isEdit.value = false
  currentRule.value = null
  formData.value = createEmptyFormData()
  drawerVisible.value = true
}

// 提交表单
const handleConfirm = async () => {
  const formRef = dispatchFormRef.value?.formRef
  if (!formRef) {
    ElMessage.warning("表单未初始化")
    return
  }

  const isValid = await formRef.validate().catch(() => false)
  if (!isValid) {
    ElMessage.warning("请完善必填信息")
    return
  }

  try {
    submitting.value = true

    // 使用清理后的表单数据
    const cleanedData = dispatchFormRef.value?.getCleanedFormData()
    if (!cleanedData) {
      ElMessage.warning("表单数据异常")
      return
    }

    if (isEdit.value && currentRule.value?.id) {
      await updateDispatchRuleApi({ id: currentRule.value.id, ...cleanedData })
      ElMessage.success("更新成功")
    } else {
      await createDispatchRuleApi(cleanedData)
      ElMessage.success("创建成功")
    }

    handleCancel()
    loadRules()
  } catch (error) {
    console.error("保存失败:", error)
    ElMessage.error(isEdit.value ? "更新失败" : "创建失败")
  } finally {
    submitting.value = false
  }
}

// 取消操作
const handleCancel = () => {
  drawerVisible.value = false
  isEdit.value = false
  currentRule.value = null
  formData.value = createEmptyFormData()
}

// 操作事件处理
const operateEvent = (row: DispatchRule, action: string) => {
  switch (action) {
    case "edit":
      handleEdit(row)
      break
    case "toggle":
      handleToggle(row)
      break
    case "delete":
      handleDelete(row)
      break
  }
}

// 处理拖拽排序
const handleRowDrag = async (newData: DispatchRule[]) => {
  try {
    // 找到被移动的规则
    for (let i = 0; i < newData.length; i++) {
      const newRule = newData[i]
      const originalRule = allRules.value[i]

      // 如果规则ID不匹配，说明这个规则被移动了
      if (originalRule && newRule.id !== originalRule.id) {
        // 直接调用交换接口
        await swapPrioritiesApi({
          src_id: originalRule.id,
          dst_id: newRule.id
        })
        ElMessage.success("优先级更新成功")
        return
      }
    }
  } finally {
    loadRules()
  }
}

// 编辑规则
const handleEdit = (rule: DispatchRule) => {
  isEdit.value = true
  currentRule.value = rule
  // 使用工具函数转换数据（已自动清空零值）
  formData.value = convertRuleToFormData(rule)
  drawerVisible.value = true
}

// 切换规则状态
const handleToggle = async (rule: DispatchRule) => {
  await toggleDispatchRuleStatusApi(rule.id)
  ElMessage.success(`${rule.enabled ? "禁用" : "启用"}成功`)
  loadRules()
}

// 删除规则
const handleDelete = async (rule: DispatchRule) => {
  await ElMessageBox.confirm(`确定要删除分发规则"${rule.name}"吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

  await deleteDispatchRuleApi(rule.id)
  ElMessage.success("删除成功")
  loadRules()
}

// 初始化
onMounted(() => {
  initPageData()
})
</script>

<style lang="scss" scoped>
// 响应式筛选操作栏
.filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  flex: 0 0 120px;
  width: 120px;
  flex-shrink: 0;

  &.rule-filter {
    flex: 0 1 auto;
    min-width: 350px;
    max-width: 400px;
  }

  &:deep(.el-select) {
    width: 100%;
  }

  &:deep(.el-select__wrapper) {
    min-width: 0;
  }
}

.name-cell {
  .rule-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    line-height: 1.5;
  }
}

.description-cell {
  .rule-description {
    margin: 0;
    font-size: 12px;
    color: #999;
    line-height: 1.5;
  }
}

.workspace-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-placeholder {
  color: #999;
  font-size: 12px;
}

:deep(.el-table) {
  .cell {
    overflow: visible;
  }
}
</style>
