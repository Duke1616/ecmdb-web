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
            @click="listDispatchesData"
          />
        </div>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 -->
    <el-empty v-if="!canViewDispatch" class="dispatch-empty" description="您没有权限查看自动派发配置" />
    <DataTable
      v-else
      :data="dispatchesData"
      :columns="tableColumns"
      :pagination="paginationData"
      :loading="loading"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <template #templateName>
        {{ templateData?.name }}
      </template>

      <template #fieldName="{ row }">
        {{ fieldMap.get(row.field) }}
      </template>

      <template #runnerName="{ row }">
        {{ runnerMap.get(row.runner_id) }}
      </template>

      <template #actions="{ row }">
        <OperateBtn
          :items="operateBtnItems"
          :operate-item="row"
          :max-length="3"
          @route-event="(data: dispatch, action: string) => operateEvent(action, data)"
        />
      </template>
    </DataTable>

    <!-- 自动派发 -->
    <FormDialog
      v-model="dialogVisible"
      title="自动派发"
      width="30%"
      @confirm="handlerSubmitDispatch"
      @cancel="onClosed"
    >
      <TemplateDispatchForm
        ref="apiRef"
        :fields-map="fieldMap"
        :template-id="templateData?.id"
        :runner-map="runnerMap"
        @callback="listDispatchesData"
        @closed="onClosed"
      />
    </FormDialog>

    <!-- 同步其他 -->
    <FormDialog v-model="syncVisible" title="同步数据" width="30%" @confirm="handlerSubmiSync" @cancel="onSyncClosed">
      <TemplateDispatchSync
        ref="syncRef"
        :template-id="templateData?.id"
        @callback="listDispatchesData"
        @closed="onSyncClosed"
      />
    </FormDialog>
  </PageContainer>
</template>

<script setup lang="ts">
// ==================== 导入模块 ====================
import type { dispatch } from "@/api/ticket/dispatch/types/dispatch.js"
import { usePagination } from "@/common/composables/usePagination"
import { computed, h, nextTick, onMounted, ref, watch, type Component } from "vue"
import { CirclePlus, Connection, RefreshRight } from "@element-plus/icons-vue"
import { deleteDispatchApi, listDispatchesByTemplateIdApi } from "@/api/ticket/dispatch/index.js"
import type { template } from "@/api/ticket/template/types/template.js"
import { ElMessage, ElMessageBox } from "element-plus"
import type { ButtonType } from "element-plus"
import type { runner } from "@/api/task/runner/types/runner.js"
import { listRunnerByIdsApi, listRunnerByWorkflowIdApi } from "@/api/task/runner/index.js"
import { detailTemplateApi } from "@/api/ticket/template/index.js"
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
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
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
const fieldMap = new Map<string, string>()

// 表格数据
const dispatchesData = ref<dispatch[]>([])

import type { Column } from "@@/components/DataTable/types"

enum DispatchAction {
  Edit = "edit",
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

interface TemplateRuleNode {
  type?: string
  field?: string
  title?: string
  children?: TemplateRuleNode[]
}

const isTemplateRuleNode = (value: unknown): value is TemplateRuleNode => {
  return typeof value === "object" && value !== null
}

// ==================== 表格配置 ====================
const tableColumns: Column[] = [
  { prop: "template_id", label: "模版名称", slot: "templateName", align: "center" },
  { prop: "field", label: "字段名称", slot: "fieldName", align: "center" },
  { prop: "value", label: "字段值", align: "center" },
  { prop: "runner_name", label: "执行器名称", slot: "runnerName", align: "center" }
]

const operateBtnItems: DispatchOperateItem[] = [
  { code: DispatchAction.Edit, name: "修改", type: "primary", capability: TICKET_CAPABILITIES.Dispatch.Edit },
  { code: DispatchAction.Delete, name: "删除", type: "danger", capability: TICKET_CAPABILITIES.Dispatch.Delete }
]

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
  listDispatchesData()
}

// ==================== 执行器管理 ====================
const listRunnerByWorkflowId = async (): Promise<boolean> => {
  if (!templateData.value?.workflow_id) {
    return false
  }

  try {
    const { data } = await listRunnerByWorkflowIdApi(templateData.value.workflow_id)

    const updatedMap = new Map(runnerMap.value)

    if (data.runners && Array.isArray(data.runners)) {
      data.runners.forEach((item: runner) => {
        if (!updatedMap.has(item.id)) {
          updatedMap.set(item.id, item.name)
        }
      })
    }

    runnerMap.value = updatedMap
    return true
  } catch (error) {
    return false
  }
}

const supplementRunnerNames = async () => {
  const missingRunnerIds = dispatchesData.value
    .filter((item) => !runnerMap.value.has(item.runner_id))
    .map((item) => item.runner_id)
    .filter((id, index, arr) => arr.indexOf(id) === index)

  if (missingRunnerIds.length === 0) return

  try {
    const { data } = await listRunnerByIdsApi(missingRunnerIds)
    const newMap = new Map(runnerMap.value)
    data.runners.forEach((runner: runner) => {
      newMap.set(runner.id, runner.name)
    })
    runnerMap.value = newMap
  } catch (error) {
    // 静默处理错误
  }
}

const checkRunners = async (): Promise<boolean> => {
  try {
    if (!templateData.value?.workflow_id) {
      return false
    }

    const success = await listRunnerByWorkflowId()
    if (!success) {
      return false
    }

    return runnerMap.value.size > 0
  } catch (error) {
    return false
  }
}

// ==================== 数据查询 ====================
const listDispatchesData = async () => {
  if (!templateData.value || !canViewDispatch.value) return

  loading.value = true
  try {
    const { data } = await listDispatchesByTemplateIdApi({
      template_id: templateData.value.id,
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    })

    paginationData.total = data.total
    dispatchesData.value = data.dispatches
    await supplementRunnerNames()
  } catch (error) {
    dispatchesData.value = []
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

  if (!(await checkRunners())) {
    ElMessage.warning("当前流程暂无可用执行器")
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.resetForm()
  })
}

const handlerUpdate = async (row: dispatch) => {
  if (!hasPermission(TICKET_CAPABILITIES.Dispatch.Edit)) {
    ElMessage.warning("暂无修改自动派发权限")
    return
  }

  if (!(await checkRunners())) {
    ElMessage.warning("当前流程暂无可用执行器")
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.setForm(row)
  })
}

const handlerDelete = (row: dispatch) => {
  if (!hasPermission(TICKET_CAPABILITIES.Dispatch.Delete)) {
    ElMessage.warning("暂无删除自动派发权限")
    return
  }

  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除 ID: "),
      h("i", { style: "color: red" }, `${row.id}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteDispatchApi(row.id)
      ElMessage.success("删除成功")
      listDispatchesData()
    } catch (error) {
      // 错误由后端处理
    }
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

const handlerSubmiSync = () => {
  syncRef.value?.syncSubmit()
}

const operateEvent = (action: string, row: dispatch) => {
  switch (action) {
    case DispatchAction.Edit:
      handlerUpdate(row)
      break
    case DispatchAction.Delete:
      handlerDelete(row)
      break
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

// ==================== 监听器 ====================
watch([() => paginationData.currentPage, () => paginationData.pageSize], listDispatchesData, { immediate: true })

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
</style>
