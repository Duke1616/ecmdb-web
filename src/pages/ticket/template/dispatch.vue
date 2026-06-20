<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      :title="`自动派发 - ${templateData?.name || '未选择模版'}`"
      subtitle="根据模版字段自行匹配执行器"
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
            新增派发
          </AuthButton>
          <AuthButton
            type="success"
            :icon="Connection"
            :capability="TICKET_CAPABILITIES.Dispatch.Sync"
            class="u-gov-btn is-large"
            @click="handlerSync"
          >
            同步配置
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
    <el-empty v-if="!canViewDispatch" class="dispatch-empty" description="您没有权限查看自动派发配置" />
    <DataTable v-else :data="automationRows" :columns="tableColumns" :loading="loading">
      <template #templateName>
        {{ templateData?.name }}
      </template>

      <template #codebookId="{ row }">
        <el-tag type="info" effect="plain">{{ row.codebookId }}</el-tag>
      </template>

      <template #runners="{ row }">
        <div class="runner-tags">
          <el-tag v-for="item in row.runners.slice(0, 3)" :key="item.id" type="success" effect="plain">
            {{ item.name }}
          </el-tag>
          <el-tag v-if="row.runners.length > 3" type="info" effect="plain">+{{ row.runners.length - 3 }}</el-tag>
          <span v-if="row.runners.length === 0" class="muted-text">暂无执行器</span>
        </div>
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

    <!-- 自动派发 -->
    <FormDialog
      v-model="dialogVisible"
      title="自动派发"
      width="760px"
      @confirm="handlerSubmitDispatch"
      @cancel="onClosed"
    >
      <TemplateDispatchForm
        ref="apiRef"
        :fields-map="fieldMap"
        :template-id="templateData?.id"
        :automation-codebooks="automationCodebookMap"
        :runners="workflowRunners"
        @callback="loadAutomationDispatchData"
        @closed="onClosed"
      />
    </FormDialog>

    <!-- 同步其他 -->
    <FormDialog
      v-model="syncVisible"
      title="同步配置"
      width="min(92vw, 980px)"
      full-height
      :show-footer="false"
      :show-footer-info="false"
      @cancel="onSyncClosed"
    >
      <TemplateDispatchSync
        ref="syncRef"
        :template-id="templateData?.id"
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
import { listRunnerByCodebookIdApi } from "@/api/task/runner/index.js"
import { deleteDispatchApi } from "@/api/ticket/dispatch"
import { detailTemplateApi } from "@/api/ticket/template/index.js"
import { getAutomationCodebookUidsApi } from "@/api/ticket/workflow/workflow"
import type { AutomationCodebookValue } from "@/api/ticket/workflow/types/workflow"
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
const runnerMap = ref<Map<number, string>>(new Map())
const automationCodebookMap = ref<Map<string, number>>(new Map())
const dispatchIdMap = ref<Map<string, number>>(new Map())
const workflowRunners = ref<runner[]>([])
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
  dispatchId?: number
  nodeName: string
  codebookId: number
  runnerCount: number
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

const resolveAutomationCodebookId = (value: AutomationCodebookValue): number => {
  if (typeof value === "number") return value

  if (typeof value === "string") {
    const id = Number(value)
    return Number.isFinite(id) ? id : 0
  }

  return value.codebook_id
}

const resolveAutomationDispatchId = (value: AutomationCodebookValue): number | undefined => {
  if (typeof value !== "object" || value === null) return undefined
  return value.dispatch_id ?? value.id
}

// ==================== 表格配置 ====================
const tableColumns: Column[] = [
  { prop: "template_id", label: "模版名称", slot: "templateName", align: "center" },
  { prop: "nodeName", label: "自动化节点", align: "center", minWidth: 160 },
  { prop: "codebookId", label: "脚本模板 ID", slot: "codebookId", align: "center", minWidth: 180 },
  { prop: "runnerCount", label: "可用执行器", align: "center", width: 110 },
  { prop: "runners", label: "执行器", slot: "runners", align: "center", minWidth: 220 }
]

const getOperateBtnItems = (row: AutomationDispatchRow): DispatchOperateItem[] => [
  {
    code: DispatchAction.Configure,
    name: "配置",
    type: "primary",
    icon: Setting,
    capability: TICKET_CAPABILITIES.Dispatch.Add
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

const automationRows = computed<AutomationDispatchRow[]>(() =>
  Array.from(automationCodebookMap.value, ([nodeName, codebookId]) => {
    const runners = workflowRunners.value.filter((item) => item.codebook_id === codebookId)
    return {
      id: `${nodeName}:${codebookId}`,
      dispatchId: dispatchIdMap.value.get(nodeName),
      nodeName,
      codebookId,
      runnerCount: runners.length,
      runners
    }
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

// ==================== 执行器管理 ====================
const fetchAutomationCodebooks = async (): Promise<boolean> => {
  if (!templateData.value?.workflow_id) {
    return false
  }

  try {
    const { data } = await getAutomationCodebookUidsApi(templateData.value.workflow_id)
    const automationCodebooks = data.automation_codebooks || {}
    const entries = Object.entries(automationCodebooks)
      .map(([nodeName, value]) => [nodeName, resolveAutomationCodebookId(value)] as [string, number])
      .filter((entry): entry is [string, number] => Number.isFinite(entry[1]) && entry[1] > 0)

    dispatchIdMap.value = new Map(
      Object.entries(automationCodebooks)
        .map(([nodeName, value]) => [nodeName, resolveAutomationDispatchId(value)] as [string, number | undefined])
        .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    )
    automationCodebookMap.value = new Map(entries)
    return automationCodebookMap.value.size > 0
  } catch (error) {
    automationCodebookMap.value = new Map()
    dispatchIdMap.value = new Map()
    return false
  }
}

const listRunnersByAutomationCodebooks = async (): Promise<boolean> => {
  const codebookIds = Array.from(new Set(Array.from(automationCodebookMap.value.values()).filter((id) => id > 0)))

  if (codebookIds.length === 0) {
    workflowRunners.value = []
    return false
  }

  try {
    const responses = await Promise.all(
      codebookIds.map((codebookId) =>
        listRunnerByCodebookIdApi({
          codebook_id: codebookId,
          offset: 0,
          limit: 1000
        })
      )
    )

    const runners = responses.flatMap(({ data }) => data.runners || [])
    const uniqueRunners = new Map<number, runner>()
    const updatedMap = new Map(runnerMap.value)

    runners.forEach((item) => {
      uniqueRunners.set(item.id, item)
      updatedMap.set(item.id, item.name)
    })

    workflowRunners.value = Array.from(uniqueRunners.values())
    runnerMap.value = updatedMap
    return workflowRunners.value.length > 0
  } catch (error) {
    workflowRunners.value = []
    return false
  }
}

// ==================== 数据查询 ====================
const loadAutomationDispatchData = async () => {
  if (!templateData.value || !canViewDispatch.value) return

  loading.value = true
  try {
    const hasAutomationCodebooks = await fetchAutomationCodebooks()
    if (hasAutomationCodebooks) {
      await listRunnersByAutomationCodebooks()
    } else {
      workflowRunners.value = []
    }
  } catch (error) {
    automationCodebookMap.value = new Map()
    workflowRunners.value = []
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
    ElMessage.warning("暂无新增自动派发权限")
    return
  }

  // if (!(await checkRunners())) {
  //   ElMessage.warning("当前流程暂无可用执行器")
  //   return
  // }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.resetForm()
  })
}

const handlerConfigure = async (row: AutomationDispatchRow) => {
  if (!hasPermission(TICKET_CAPABILITIES.Dispatch.Add)) {
    ElMessage.warning("暂无新增自动派发权限")
    return
  }

  if (row.runners.length === 0) {
    ElMessage.warning("当前自动化节点暂无可用执行器")
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.resetForm()
    apiRef.value?.selectAutomationByName(row.nodeName)
  })
}

const handlerDelete = (row: AutomationDispatchRow) => {
  if (!hasPermission(TICKET_CAPABILITIES.Dispatch.Delete)) {
    ElMessage.warning("暂无删除自动派发权限")
    return
  }

  if (!row.dispatchId) {
    ElMessage.warning("当前自动化节点没有可删除的派发配置")
    return
  }

  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除自动化节点 "),
      h("i", { style: "color: red" }, row.nodeName),
      h("span", null, " 的派发配置，确认删除？")
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
    ElMessage.warning("暂无同步自动派发权限")
    return
  }

  syncVisible.value = true
}

const handlerSubmitDispatch = () => {
  apiRef.value?.submitForm()
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

.runner-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.muted-text {
  color: #94a3b8;
  font-size: 13px;
}
</style>
