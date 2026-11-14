<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      :title="`执行单元路由 - ${templateData?.name || '未选择模板'}`"
      :subtitle="dispatchSummary"
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
            type="default"
            :icon="Connection"
            :capability="TICKET_CAPABILITIES.Dispatch.Sync"
            class="u-gov-btn is-large is-ghost"
            @click="handlerSync"
          >
            复制规则
          </AuthButton>
          <el-tooltip content="刷新规则" placement="bottom">
            <AuthButton
              type="default"
              :icon="RefreshRight"
              :capability="TICKET_CAPABILITIES.Dispatch.View"
              class="eiam-refresh-btn dispatch-refresh-btn"
              circle
              aria-label="刷新规则"
              @click="loadAutomationDispatchData"
            />
          </el-tooltip>
        </div>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 -->
    <el-empty v-if="!canViewDispatch" class="dispatch-empty" description="您没有权限查看执行单元路由" />
    <DataTable
      v-else
      class="dispatch-table"
      :data="automationRows"
      :columns="tableColumns"
      :loading="loading"
      :action-column-width="150"
      :table-props="{ spanMethod: getTableSpan }"
    >
      <template #node="{ row }">
        <span class="node-name">{{ row.nodeName }}</span>
      </template>

      <template #targetRunner="{ row }">
        <span v-if="row.runner" class="target-runner">{{ row.runner.name }}</span>
        <span v-else class="missing-text">执行单元不可用</span>
      </template>

      <template #rule="{ row }">
        <div class="rule-expression">
          <span class="rule-field">{{ fieldMap.get(row.dispatch.field) || row.dispatch.field }}</span>
          <span class="rule-operator">=</span>
          <span class="rule-value">{{ row.dispatch.value }}</span>
        </div>
      </template>

      <template #priority="{ row }">
        <span class="priority-value">{{ row.dispatch.priority }}</span>
      </template>

      <template #actions="{ row }">
        <OperateBtn
          :items="dispatchOperateItems"
          :operate-item="row"
          :max-length="2"
          @route-event="(data: AutomationDispatchRow, action: DispatchAction) => operateEvent(action, data)"
        />
      </template>

      <template #empty>
        <el-empty :image-size="84" description="暂无路由规则">
          <AuthButton
            type="primary"
            :icon="CirclePlus"
            :capability="TICKET_CAPABILITIES.Dispatch.Add"
            class="u-gov-btn"
            @click="handlerCreate"
          >
            新增规则
          </AuthButton>
        </el-empty>
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
import { computed, h, nextTick, onMounted, ref, watch } from "vue"
import { CirclePlus, Connection, Delete, RefreshRight, Setting } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useRoute, useRouter } from "vue-router"
import { deleteDispatchApi } from "@/api/ticket/dispatch"
import { detailTemplateApi } from "@/api/ticket/template/index.js"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { usePermission } from "@/common/composables/usePermission"
import { FormDialog } from "@@/components/Dialogs"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import type { Column } from "@@/components/DataTable/types"
import TemplateDispatchForm from "./components/TemplateDispatchForm.vue"
import TemplateDispatchSync from "./components/TemplateDispatchSync.vue"
import { useDispatchData } from "./composables/useDispatchData"
import { DispatchAction } from "./types"
import type { AutomationDispatchRow, DispatchOperateItem } from "./types"

const route = useRoute()
const router = useRouter()
const { hasPermission } = usePermission()
const canViewDispatch = computed(() => hasPermission(TICKET_CAPABILITIES.Dispatch.View))

const apiRef = ref<InstanceType<typeof TemplateDispatchForm>>()
const syncRef = ref<InstanceType<typeof TemplateDispatchSync>>()
const dialogVisible = ref(false)
const syncVisible = ref(false)

const {
  templateData,
  automationNodes,
  workflowRunners,
  fieldMap,
  loading,
  automationRows,
  dispatchSummary,
  getTableSpan,
  setForm,
  loadAutomationDispatchData
} = useDispatchData(canViewDispatch)

const tableColumns: Column[] = [
  { prop: "nodeName", label: "自动化节点", slot: "node", align: "center", minWidth: 220 },
  { prop: "rule", label: "匹配条件", slot: "rule", align: "center", minWidth: 280 },
  { prop: "targetRunner", label: "目标执行单元", slot: "targetRunner", align: "center", minWidth: 220 },
  { prop: "priority", label: "优先级", slot: "priority", align: "center", width: 100 }
]

const dispatchOperateItems: DispatchOperateItem[] = [
  {
    code: DispatchAction.Configure,
    name: "编辑",
    type: "primary",
    icon: Setting,
    capability: TICKET_CAPABILITIES.Dispatch.Edit
  },
  {
    code: DispatchAction.Delete,
    name: "删除",
    type: "danger",
    icon: Delete,
    capability: TICKET_CAPABILITIES.Dispatch.Delete
  }
]

const handleBack = () => {
  router.go(-1)
}

const handlerCreate = () => {
  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.resetForm()
  })
}

const handlerConfigure = (row: AutomationDispatchRow) => {
  if (row.runners.length === 0) {
    ElMessage.warning("当前自动化节点暂无兼容 Runner")
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.resetForm()
    apiRef.value?.selectAutomationNode(row.automationNodeId)
    apiRef.value?.setForm(row.dispatch)
  })
}

const handlerDelete = (row: AutomationDispatchRow) => {
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
    await deleteDispatchApi(row.dispatchId)
    ElMessage.success("删除成功")
    loadAutomationDispatchData()
  })
}

const handlerSync = () => {
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

const onClosed = () => {
  dialogVisible.value = false
}

const onSyncClosed = () => {
  syncVisible.value = false
  syncRef.value?.resetForm()
}

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

.node-name {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-expression {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  color: #334155;
  font-size: 13px;
}

.rule-field {
  color: #64748b;
}

.rule-operator {
  margin: 0 10px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.rule-value {
  overflow: hidden;
  color: #334155;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.target-runner {
  color: #475569;
  font-weight: 500;
}

.missing-text {
  color: #dc2626;
  font-size: 13px;
}

.priority-value {
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
}

:deep(.dispatch-table .content-card) {
  border-color: #dfe5ec;
}

:deep(.dispatch-table .el-table__header th) {
  height: 44px;
  background: #fafbfc !important;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

:deep(.dispatch-table .el-table__header th .cell) {
  min-height: 44px;
  padding-top: 10px;
  padding-bottom: 10px;
}

:deep(.dispatch-table .el-table__body td) {
  height: 56px;
}

:deep(.dispatch-table .el-table__body td .cell) {
  min-height: 56px;
  padding-top: 8px;
  padding-bottom: 8px;
}

:deep(.dispatch-table .el-table__body tr:hover > td.el-table__cell) {
  background: #fafcff;
}

@media (max-width: 900px) {
  :deep(.action-group .u-gov-btn) {
    padding: 0 12px;
  }
}
</style>
