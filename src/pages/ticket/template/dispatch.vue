<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      :title="`执行单元路由 - ${templateData?.name || '未选择模板'}`"
      :subtitle="`${automationNodes.length} 个自动化节点 · ${dispatches.length} 条条件规则`"
      :show-back-button="true"
      :show-refresh-button="false"
      @back="handleBack"
    >
      <template #actions>
        <div class="action-group">
          <AuthButton
            type="primary"
            :icon="CirclePlus"
            :capability="TICKET_CAPABILITIES.Dispatch.Add"
            class="u-gov-btn is-large"
            @click="handlerCreate"
          >
            新增规则
          </AuthButton>
          <AuthButton
            type="success"
            :icon="Connection"
            :capability="TICKET_CAPABILITIES.Dispatch.Sync"
            class="u-gov-btn is-large"
            @click="handlerSync"
          >
            复制规则
          </AuthButton>
          <AuthButton
            type="primary"
            :icon="RefreshRight"
            :capability="TICKET_CAPABILITIES.Dispatch.View"
            class="eiam-refresh-btn dispatch-refresh-btn"
            circle
            @click="loadAutomationDispatchData"
          />
        </div>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 -->
    <el-empty v-if="!canViewDispatch" class="dispatch-empty" description="您没有权限查看执行单元路由" />
    <DataTable v-else :data="automationRows" :columns="tableColumns" :loading="loading">
      <template #program="{ row }">
        <div class="runner-program">
          <span>脚本 #{{ row.codebookId }}</span>
          <el-tag type="info" effect="plain" size="small">
            {{ row.defaultRunner ? getProgramKindLabel(row.defaultRunner.program_kind) : "未设置默认执行单元" }}
          </el-tag>
        </div>
      </template>

      <template #defaultRunner="{ row }">
        <el-tag v-if="row.defaultRunner" type="info" effect="plain">
          {{ row.defaultRunner.name }}
        </el-tag>
        <span v-else class="muted-text">未配置</span>
      </template>

      <template #targetRunner="{ row }">
        <el-tag v-if="row.runner" type="success" effect="plain">
          {{ row.runner.name }}
        </el-tag>
        <span v-else class="muted-text">
          {{ row.defaultRunner ? "沿用默认执行单元" : "未设置默认执行单元" }}
        </span>
      </template>

      <template #rule="{ row }">
        <span v-if="row.dispatch"
          >{{ fieldMap.get(row.dispatch.field) || row.dispatch.field }} = {{ row.dispatch.value }}</span
        >
        <span v-else class="muted-text">未配置条件路由</span>
      </template>

      <template #priority="{ row }">
        <span v-if="row.dispatch">{{ row.dispatch.priority }}</span>
        <span v-else class="muted-text">-</span>
      </template>

      <template #actions="{ row }">
        <OperateBtn
          :items="getOperateBtnItems(row)"
          :operate-item="row"
          :max-length="2"
          @route-event="(data: AutomationDispatchRow, action: DispatchAction) => operateEvent(action, data)"
        />
      </template>
    </DataTable>

    <!-- 执行单元路由规则 -->
    <FormDialog
      v-model="dialogVisible"
      title="执行单元路由规则"
      width="560px"
      @confirm="handlerSubmitDispatch"
      @cancel="onClosed"
    >
      <TemplateDispatchForm
        ref="apiRef"
        :fields-map="fieldMap"
        :template-id="templateData?.id"
        :automation-nodes="automationNodes"
        :runners="workflowRunners"
        @callback="loadAutomationDispatchData"
        @closed="onClosed"
      />
    </FormDialog>

    <!-- 从同一工作流的模板复制规则 -->
    <FormDialog
      v-model="syncVisible"
      title="复制路由规则"
      width="520px"
      @confirm="handlerSubmitSync"
      @cancel="onSyncClosed"
    >
      <TemplateDispatchSync
        ref="syncRef"
        :template-id="templateData?.id"
        :workflow-id="templateData?.workflow_id"
        @callback="loadAutomationDispatchData"
        @closed="onSyncClosed"
      />
    </FormDialog>
  </PageContainer>
</template>

<script setup lang="ts">
// ==================== 导入模块 ====================
import { computed, h, nextTick, onMounted, ref, watch } from "vue"
import { CirclePlus, Connection, Delete, RefreshRight, Setting } from "@element-plus/icons-vue"
import type { template } from "@/api/ticket/template/types/template.js"
import { ElMessage, ElMessageBox } from "element-plus"
import type { runner } from "@/api/task/runner/types/runner.js"
import { listRunnerByCodebookIdApi, listRunnerByIdsApi } from "@/api/task/runner/index.js"
import { getProgramKindLabel } from "@/api/task/program"
import { deleteDispatchApi, listDispatchByTemplateIdApi } from "@/api/ticket/dispatch"
import type { dispatch } from "@/api/ticket/dispatch/types/dispatch"
import { detailTemplateApi } from "@/api/ticket/template/index.js"
import { getAutomationNodesApi } from "@/api/ticket/workflow/workflow"
import type { AutomationNode } from "@/api/ticket/workflow/types/workflow"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { usePermission } from "@/common/composables/usePermission"
import { FormDialog } from "@@/components/Dialogs"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import TemplateDispatchForm from "./components/TemplateDispatchForm.vue"
import TemplateDispatchSync from "./components/TemplateDispatchSync.vue"
import { useRoute, useRouter } from "vue-router"

// ==================== 路由和组合式函数 ====================
const route = useRoute()
const router = useRouter()
const { hasPermission } = usePermission()
const canViewDispatch = computed(() => hasPermission(TICKET_CAPABILITIES.Dispatch.View))

// ==================== 响应式数据 ====================
// 组件引用
const apiRef = ref<InstanceType<typeof TemplateDispatchForm>>()
const syncRef = ref<InstanceType<typeof TemplateDispatchSync>>()

// 页面状态
const templateData = ref<template>()
const dialogVisible = ref<boolean>(false)
const syncVisible = ref<boolean>(false)
const loading = ref<boolean>(false)

// 数据映射
const automationNodes = ref<AutomationNode[]>([])
const workflowRunners = ref<runner[]>([])
const dispatches = ref<dispatch[]>([])
const fieldMap = new Map<string, string>()

import type { Column } from "@@/components/DataTable/types"
import type { ButtonType } from "element-plus"
import type { Component } from "vue"

interface TemplateRuleNode {
  type?: string
  field?: string
  title?: string
  children?: TemplateRuleNode[]
}

interface AutomationDispatchRow {
  id: string
  automationNodeId: string
  dispatchId?: number
  dispatch?: dispatch
  nodeName: string
  codebookId: number
  defaultRunner?: runner
  runner?: runner
  runners: runner[]
}

enum DispatchAction {
  Configure = "configure",
  Delete = "delete"
}

interface DispatchOperateItem {
  code: DispatchAction
  name: string
  type?: ButtonType
  icon?: Component
  disabled?: boolean
  capability?: string | string[]
}

const isTemplateRuleNode = (value: unknown): value is TemplateRuleNode => {
  return typeof value === "object" && value !== null
}

// ==================== 表格配置 ====================
const tableColumns: Column[] = [
  { prop: "nodeName", label: "自动化节点", align: "center", minWidth: 160 },
  { prop: "program", label: "执行程序", slot: "program", align: "center", minWidth: 180 },
  { prop: "defaultRunner", label: "默认执行单元", slot: "defaultRunner", align: "center", minWidth: 150 },
  { prop: "rule", label: "匹配规则", slot: "rule", align: "center", minWidth: 180 },
  { prop: "priority", label: "优先级", slot: "priority", align: "center", width: 90 },
  { prop: "targetRunner", label: "命中后 Runner", slot: "targetRunner", align: "center", minWidth: 160 }
]

const getOperateBtnItems = (row: AutomationDispatchRow): DispatchOperateItem[] => [
  {
    code: DispatchAction.Configure,
    name: "配置",
    type: "primary",
    icon: Setting,
    capability: row.dispatchId ? TICKET_CAPABILITIES.Dispatch.Edit : TICKET_CAPABILITIES.Dispatch.Add
  },
  {
    code: DispatchAction.Delete,
    name: "删除",
    type: "danger",
    icon: Delete,
    disabled: !row.dispatchId,
    capability: TICKET_CAPABILITIES.Dispatch.Delete
  }
]

const getCompatibleRunners = (node: AutomationNode) =>
  workflowRunners.value.filter((item) => item.codebook_id === node.codebook_id)

const automationRows = computed<AutomationDispatchRow[]>(() =>
  automationNodes.value.flatMap((node) => {
    const defaultRunner = workflowRunners.value.find((item) => item.id === node.runner_id)
    const runners = getCompatibleRunners(node)
    const nodeDispatches = dispatches.value
      .filter((item) => item.automation_node_id === node.id)
      .sort((left, right) => right.priority - left.priority || left.id - right.id)
    const rows = nodeDispatches.length > 0 ? nodeDispatches : [undefined]

    return rows.map((dispatch) => ({
      id: `${node.id}:${dispatch?.id ?? "default"}`,
      automationNodeId: node.id,
      dispatchId: dispatch?.id,
      dispatch,
      nodeName: node.name,
      codebookId: node.codebook_id,
      defaultRunner,
      runner: dispatch ? workflowRunners.value.find((item) => item.id === dispatch.runner_id) : undefined,
      runners
    }))
  })
)

// ==================== 模版数据处理 ====================
const parseTemplateRules = (rules: unknown): TemplateRuleNode[] => {
  if (typeof rules === "string") {
    const parsed: unknown = JSON.parse(rules)
    return Array.isArray(parsed) ? parsed.filter(isTemplateRuleNode) : []
  }

  return Array.isArray(rules) ? rules.filter(isTemplateRuleNode) : []
}

const processRules = (rules: unknown, fieldMap: Map<string, string>) => {
  let rulesArray: TemplateRuleNode[] = []

  try {
    rulesArray = parseTemplateRules(rules)
  } catch (error) {
    console.warn("解析 rules JSON 失败:", error)
    return
  }

  rulesArray.forEach((item) => {
    if (item.type !== "fcRow" && item.type !== "col" && item.field) {
      fieldMap.set(item.field, item.title || item.field)
    }

    if (Array.isArray(item.children)) {
      processRules(item.children, fieldMap)
    }
  })
}

const setForm = (row: template) => {
  templateData.value = row
  processRules(row.rules, fieldMap)
  loadAutomationDispatchData()
}

// ==================== 自动化节点与执行单元 ====================
const fetchAutomationNodes = async (): Promise<boolean> => {
  if (!templateData.value?.workflow_id) {
    return false
  }

  try {
    const { data } = await getAutomationNodesApi(templateData.value.workflow_id)
    automationNodes.value = (data.automation_nodes || []).filter((node) => node.id && node.codebook_id > 0)
    return automationNodes.value.length > 0
  } catch (error) {
    automationNodes.value = []
    return false
  }
}

const listRunnersByAutomationNodes = async (): Promise<boolean> => {
  const runnerIds = Array.from(new Set(automationNodes.value.map((node) => node.runner_id).filter((id) => id > 0)))

  try {
    const defaultRunners = runnerIds.length > 0 ? (await listRunnerByIdsApi(runnerIds)).data.runners || [] : []
    const codebookIds = Array.from(
      new Set(automationNodes.value.map((node) => node.codebook_id).filter((id) => id > 0))
    )
    const responses = await Promise.all(codebookIds.map((codebookId) => listRunnerByCodebookIdApi(codebookId)))
    const candidates = responses.flatMap(({ data }) => data.runners || [])
    const uniqueRunners = new Map<number, runner>()
    for (const item of [...defaultRunners, ...candidates]) {
      uniqueRunners.set(item.id, item)
    }

    workflowRunners.value = Array.from(uniqueRunners.values())
    return workflowRunners.value.length > 0
  } catch (error) {
    workflowRunners.value = []
    return false
  }
}

const listDispatchesByTemplate = async (): Promise<boolean> => {
  if (!templateData.value?.id) {
    dispatches.value = []
    return false
  }

  try {
    const { data } = await listDispatchByTemplateIdApi({
      template_id: templateData.value.id,
      offset: 0,
      limit: 1000
    })
    dispatches.value = data.dispatches || []
    return dispatches.value.length > 0
  } catch (error) {
    dispatches.value = []
    return false
  }
}

// ==================== 数据查询 ====================
const loadAutomationDispatchData = async () => {
  if (!templateData.value || !canViewDispatch.value) return

  loading.value = true
  try {
    const hasAutomationNodes = await fetchAutomationNodes()
    if (hasAutomationNodes) {
      await listRunnersByAutomationNodes()
      await listDispatchesByTemplate()
    } else {
      workflowRunners.value = []
      dispatches.value = []
    }
  } catch (error) {
    automationNodes.value = []
    workflowRunners.value = []
    dispatches.value = []
  } finally {
    loading.value = false
  }
}

// ==================== 事件处理 ====================
const handleBack = () => {
  router.go(-1)
}

const handlerCreate = async () => {
  if (!hasPermission(TICKET_CAPABILITIES.Dispatch.Add)) {
    ElMessage.warning("暂无新增执行单元路由权限")
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.resetForm()
  })
}

const handlerConfigure = async (row: AutomationDispatchRow) => {
  const capability = row.dispatchId ? TICKET_CAPABILITIES.Dispatch.Edit : TICKET_CAPABILITIES.Dispatch.Add
  if (!hasPermission(capability)) {
    ElMessage.warning(row.dispatchId ? "暂无修改执行单元路由权限" : "暂无新增执行单元路由权限")
    return
  }

  if (row.runners.length === 0) {
    ElMessage.warning("当前自动化节点暂无兼容 Runner")
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.resetForm()
    apiRef.value?.selectAutomationNode(row.automationNodeId)
    if (row.dispatch) {
      apiRef.value?.setForm(row.dispatch)
    }
  })
}

const handlerDelete = (row: AutomationDispatchRow) => {
  if (!hasPermission(TICKET_CAPABILITIES.Dispatch.Delete)) {
    ElMessage.warning("暂无删除执行单元路由权限")
    return
  }

  if (!row.dispatchId) {
    ElMessage.warning("当前自动化节点没有可删除的路由规则")
    return
  }

  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除自动化节点 "),
      h("i", { style: "color: red" }, row.nodeName),
      h("span", null, " 的路由规则，确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteDispatchApi(row.dispatchId!)
    ElMessage.success("删除成功")
    loadAutomationDispatchData()
  })
}

const handlerSync = () => {
  if (!hasPermission(TICKET_CAPABILITIES.Dispatch.Sync)) {
    ElMessage.warning("暂无复制执行单元路由权限")
    return
  }

  syncVisible.value = true
}

const handlerSubmitDispatch = () => {
  apiRef.value?.submitForm()
}

const handlerSubmitSync = () => {
  syncRef.value?.syncSubmit()
}

const operateEvent = (action: DispatchAction, row: AutomationDispatchRow) => {
  if (action === DispatchAction.Configure) {
    handlerConfigure(row)
  } else if (action === DispatchAction.Delete) {
    handlerDelete(row)
  }
}

// ==================== 对话框事件 ====================
const onClosed = () => {
  dialogVisible.value = false
}

const onSyncClosed = () => {
  syncVisible.value = false
  syncRef.value?.resetForm()
}

// ==================== 页面初始化 ====================
const templateId = route.query.id as string

const fetchTemplateDetail = async (id: string) => {
  if (!canViewDispatch.value) return

  try {
    const res = await detailTemplateApi(parseInt(id))
    setForm(res.data)
  } catch (error) {
    console.error("获取模版详情失败:", error)
    ElMessage.error("获取模版详情失败")
    router.go(-1)
  }
}

onMounted(() => {
  if (!canViewDispatch.value) return

  if (templateId) {
    fetchTemplateDetail(templateId)
  } else {
    ElMessage.warning("未选择模版")
    router.go(-1)
  }
})

watch(canViewDispatch, (allowed) => {
  if (allowed && templateId) fetchTemplateDetail(templateId)
})
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

<style lang="scss" scoped>
.dispatch-empty {
  flex: 1;
  min-height: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

:deep(.action-group) {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.action-group .el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

:deep(.action-group .u-gov-btn > span) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  line-height: 1;
}

:deep(.action-group .el-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

:deep(.action-group .el-icon svg) {
  display: block;
}

:deep(.dispatch-refresh-btn.el-button) {
  width: 38px;
  height: 38px;
  padding: 0;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: none;

  &:hover,
  &:focus {
    color: #3b82f6;
    background: #eff6ff;
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: none;
  }

  .el-icon {
    width: 16px;
    height: 16px;
    font-size: 16px;
  }
}

.runner-program {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.muted-text {
  color: #94a3b8;
  font-size: 13px;
}
</style>
