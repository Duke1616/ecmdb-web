<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="分发规则" subtitle="管理告警分发规则" @refresh="loadRules">
      <template #actions>
        <el-select
          v-model="scopeFilter"
          placeholder="筛选作用域"
          style="width: 120px; margin-right: 12px"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="all" />
          <el-option label="全局" value="global" />
          <el-option label="规则" value="rule" />
        </el-select>
        <el-select
          v-model="matchTypeFilter"
          placeholder="筛选类型"
          style="width: 120px; margin-right: 12px"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="all" />
          <el-option label="路由分发" value="routing" />
          <el-option label="创建工单" value="ticket" />
        </el-select>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleCreate"> 添加规则 </el-button>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="rules"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="false"
      v-loading="loading"
    >
      <!-- 规则名称插槽 -->
      <template #name="{ row }">
        <div class="name-cell">
          <h4 class="rule-name">{{ row.name }}</h4>
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
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="3" @route-event="operateEvent" />
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
      <DispatchForm v-if="Object.keys(formData).length > 0" ref="dispatchFormRef" v-model:form-data="formData" />
    </Drawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import type { DispatchRule, SaveDispatchRuleReq } from "@/api/alert/dispatch/types"
import type { Workspace } from "@/api/alert/workspace/types"
import {
  listDispatchRulesByScopeApi,
  createDispatchRuleApi,
  updateDispatchRuleApi,
  deleteDispatchRuleApi,
  toggleDispatchRuleStatusApi
} from "@/api/alert/dispatch/index"
import { listWorkspacesApi } from "@/api/alert/workspace"
import { useDispatchUtils } from "./composables/useDispatchUtils"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import { Drawer } from "@@/components/Dialogs"
import DispatchForm from "./components/DispatchForm.vue"

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

// 筛选条件
const scopeFilter = ref("all")
const matchTypeFilter = ref("all")

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
  { prop: "name", label: "规则名称", flex: 2, slot: "name" },
  { prop: "scope", label: "作用域", flex: 1, slot: "scope" },
  { prop: "match_type", label: "类型", flex: 1, slot: "matchType" },
  { prop: "enabled", label: "状态", flex: 0.8, slot: "enabled" },
  { prop: "workspace_id", label: "目标工作空间", flex: 1, slot: "workspace" }
]

// 根据筛选条件过滤规则
const rules = computed(() => {
  let filtered = [...allRules.value]

  // 按作用域筛选
  if (scopeFilter.value !== "all") {
    filtered = filtered.filter((rule) => rule.scope === scopeFilter.value)
  }

  // 按匹配类型筛选
  if (matchTypeFilter.value !== "all") {
    filtered = filtered.filter((rule) => rule.match_type === matchTypeFilter.value)
  }

  return filtered
})

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

// 筛选条件变化处理
const handleFilterChange = () => {
  // 筛选逻辑已通过 computed 自动处理
}

// 加载规则列表
const loadRules = async () => {
  try {
    loading.value = true
    const response = await listDispatchRulesByScopeApi("global")
    // 确保 dispatch_rules 是数组
    allRules.value = Array.isArray(response.data.dispatch_rules) ? response.data.dispatch_rules : []
  } catch (error) {
    console.error("加载分发规则失败:", error)
    ElMessage.error("加载失败")
    allRules.value = []
  } finally {
    loading.value = false
  }
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
  if (!formRef) return

  const isValid = await formRef.validate().catch(() => false)
  if (!isValid) return

  try {
    submitting.value = true

    // 使用清理后的表单数据
    const cleanedData = dispatchFormRef.value?.getCleanedFormData()
    if (!cleanedData) return

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
  try {
    await toggleDispatchRuleStatusApi(rule.id)
    ElMessage.success(`${rule.enabled ? "禁用" : "启用"}成功`)
    loadRules()
  } catch (error) {
    console.error("切换状态失败:", error)
    ElMessage.error("操作失败")
  }
}

// 删除规则
const handleDelete = async (rule: DispatchRule) => {
  try {
    await ElMessageBox.confirm(`确定要删除分发规则"${rule.name}"吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteDispatchRuleApi(rule.id)
    ElMessage.success("删除成功")
    loadRules()
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  }
}

// 初始化
onMounted(() => {
  initPageData()
})
</script>

<style lang="scss" scoped>
.name-cell {
  .rule-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    line-height: 1.5;
  }

  .rule-description {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: #999;
    line-height: 1.5;
  }
}

.workspace-cell {
  display: flex;
  align-items: center;
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
