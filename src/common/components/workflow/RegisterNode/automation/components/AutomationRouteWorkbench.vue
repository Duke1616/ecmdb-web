<template>
  <el-tooltip :content="routeSummary" placement="top">
    <el-badge :value="totalRuleCount" :hidden="totalRuleCount === 0" class="route-trigger">
      <el-button :icon="Setting" :loading="loading" :disabled="disabled || !codebookId" @click="openWorkbench">
        动态路由
      </el-button>
    </el-badge>
  </el-tooltip>

  <BaseDialog
    v-model="workbenchVisible"
    width="min(960px, calc(100vw - 32px))"
    type="custom"
    :show-close="true"
    :close-on-click-modal="false"
    :full-height="true"
  >
    <template #header>
      <div class="route-dialog-header">
        <div class="header-icon">
          <el-icon><Guide /></el-icon>
        </div>
        <div class="header-text">
          <h3>动态路由</h3>
          <p>根据工单字段将当前自动化节点路由到其他执行单元</p>
        </div>
      </div>
    </template>

    <div class="automation-route-dialog">
      <div v-loading="loading" class="route-panel-body">
        <el-empty v-if="!loading && templates.length === 0" :description="emptyDescription" />

        <div v-else-if="templates.length > 0" class="workbench-layout">
          <aside class="template-panel">
            <el-input
              v-model="templateKeyword"
              :prefix-icon="Search"
              clearable
              placeholder="搜索工单模板"
              class="template-search-input"
            />
            <el-scrollbar class="template-scrollbar">
              <button
                v-for="item in filteredTemplates"
                :key="item.id"
                type="button"
                class="template-item"
                :class="{ 'is-active': item.id === selectedTemplateId }"
                @click="selectedTemplateId = item.id"
              >
                <el-icon><Tickets /></el-icon>
                <span class="template-name">{{ item.name }}</span>
                <span class="template-count">{{ getTemplateRuleCount(item.id) }}</span>
              </button>
              <div v-if="filteredTemplates.length === 0" class="template-empty">暂无匹配模板</div>
            </el-scrollbar>
            <div class="template-footer">共 {{ templates.length }} 个模板</div>
          </aside>

          <section class="rules-panel">
            <div class="rules-header">
              <div class="rules-title">
                <span>路由规则</span>
                <small>{{ currentTemplate?.name }} · {{ currentRules.length }} 条</small>
              </div>
              <div class="rules-actions">
                <el-input
                  v-model="ruleKeyword"
                  :prefix-icon="Search"
                  clearable
                  placeholder="搜索当前模板规则"
                  class="rule-search-input"
                />
                <el-tooltip content="新增路由规则" placement="top">
                  <el-button type="primary" :icon="Plus" :disabled="!canAdd || !codebookId" @click="openEditor()">
                    新增规则
                  </el-button>
                </el-tooltip>
              </div>
            </div>

            <el-scrollbar v-if="filteredCurrentRules.length > 0" class="rules-scrollbar">
              <el-table :data="filteredCurrentRules" table-layout="fixed" class="route-table">
                <el-table-column label="匹配条件" min-width="190">
                  <template #default="{ row }">
                    <div class="condition-cell" :title="getConditionText(row)">
                      <span class="condition-field">{{ fieldMap.get(row.field) || row.field }}</span>
                      <span class="condition-operator">=</span>
                      <span class="condition-value">{{ row.value }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="目标执行单元" min-width="150">
                  <template #default="{ row }">
                    <div class="runner-cell" :title="getRunnerName(row.runner_id)">
                      {{ getRunnerName(row.runner_id) }}
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="priority" label="优先级" width="72" align="center" />
                <el-table-column label="操作" width="112" align="center">
                  <template #default="{ row }">
                    <div class="table-actions">
                      <el-tooltip content="编辑" placement="top">
                        <el-button link :icon="EditPen" :disabled="!canEdit" @click="openEditor(row)" />
                      </el-tooltip>
                      <el-tooltip content="删除" placement="top">
                        <el-button link type="danger" :icon="Delete" :disabled="!canDelete" @click="removeRule(row)" />
                      </el-tooltip>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-scrollbar>

            <div v-else class="rules-empty">
              <el-empty :description="ruleKeyword.trim() ? '没有匹配的路由规则' : '当前模板尚未配置动态路由'">
                <el-button
                  v-if="canAdd && !ruleKeyword.trim()"
                  type="primary"
                  :disabled="!codebookId"
                  @click="openEditor()"
                >
                  新增规则
                </el-button>
              </el-empty>
            </div>
          </section>
        </div>
      </div>
    </div>
  </BaseDialog>

  <FormDialog
    v-model="editorVisible"
    :title="editingRule ? '编辑路由规则' : '新增路由规则'"
    width="min(560px, calc(100vw - 32px))"
    :header-icon="Guide"
    @confirm="submitEditor"
    @cancel="closeEditor"
    @closed="resetEditor"
  >
    <TemplateDispatchForm
      ref="dispatchFormRef"
      :fields-map="fieldMap"
      :template-id="selectedTemplateId"
      :automation-nodes="automationNodes"
      :fixed-automation-node-id="automationNodeId"
      :runners="runners"
      @callback="handleRuleSaved"
      @closed="closeEditor"
    />
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { Delete, EditPen, Guide, Plus, Search, Setting, Tickets } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { deleteDispatchApi, listDispatchByTemplateIdApi } from "@/api/ticket/dispatch"
import type { dispatch } from "@/api/ticket/dispatch/types/dispatch"
import type { runner } from "@/api/task/runner/types/runner"
import { getTemplateByWorkflowIdApi } from "@/api/ticket/template"
import type { template } from "@/api/ticket/template/types/template"
import type { AutomationNode } from "@/api/ticket/workflow/types/workflow"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { BaseDialog, FormDialog } from "@/common/components/Dialogs"
import TemplateDispatchForm from "@/pages/ticket/template/components/TemplateDispatchForm.vue"

interface Props {
  workflowId?: number
  automationNodeId?: string
  automationNodeName: string
  codebookId: number
  defaultRunnerId?: number
  runners: runner[]
  disabled?: boolean
}

interface TemplateRuleNode {
  type?: string
  field?: string
  title?: string
  children?: TemplateRuleNode[]
}

const props = defineProps<Props>()
const { hasPermission } = usePermission()

const workbenchVisible = ref(false)
const editorVisible = ref(false)
const loading = ref(false)
const loadFailed = ref(false)
const templates = ref<template[]>([])
const dispatchesByTemplate = ref(new Map<number, dispatch[]>())
const selectedTemplateId = ref<number>()
const templateKeyword = ref("")
const ruleKeyword = ref("")
const editingRule = ref<dispatch>()
const dispatchFormRef = ref<InstanceType<typeof TemplateDispatchForm>>()

const canView = computed(() => hasPermission(TICKET_CAPABILITIES.Dispatch.View))
const canAdd = computed(() => hasPermission(TICKET_CAPABILITIES.Dispatch.Add))
const canEdit = computed(() => hasPermission(TICKET_CAPABILITIES.Dispatch.Edit))
const canDelete = computed(() => hasPermission(TICKET_CAPABILITIES.Dispatch.Delete))

const currentTemplate = computed(() => templates.value.find((item) => item.id === selectedTemplateId.value))
const filteredTemplates = computed(() => {
  const keyword = templateKeyword.value.trim().toLowerCase()
  if (!keyword) return templates.value
  return templates.value.filter((item) => item.name.toLowerCase().includes(keyword))
})
const currentRules = computed(() =>
  (dispatchesByTemplate.value.get(selectedTemplateId.value || 0) || [])
    .filter((item) => item.automation_node_id === props.automationNodeId)
    .sort((left, right) => right.priority - left.priority || left.id - right.id)
)
const filteredCurrentRules = computed(() => {
  const keyword = ruleKeyword.value.trim().toLowerCase()
  if (!keyword) return currentRules.value
  return currentRules.value.filter((item) =>
    [fieldMap.value.get(item.field) || item.field, item.value, getRunnerName(item.runner_id), item.priority]
      .join(" ")
      .toLowerCase()
      .includes(keyword)
  )
})
const totalRuleCount = computed(() =>
  Array.from(dispatchesByTemplate.value.values()).reduce(
    (total, items) => total + items.filter((item) => item.automation_node_id === props.automationNodeId).length,
    0
  )
)
const routeSummary = computed(() => {
  if (!canView.value) return "暂无查看权限"
  if (!props.codebookId) return "请先选择脚本文件"
  if (loading.value) return "正在加载动态路由..."
  if (loadFailed.value) return "动态路由加载失败"
  if (!props.workflowId) return "保存工作流后可配置"
  if (templates.value.length === 0) return "绑定工单模板后可配置"
  if (templates.value.length === 1) return totalRuleCount.value ? `已配置 ${totalRuleCount.value} 条规则` : "尚未配置"
  return `${templates.value.length} 个模板 · ${totalRuleCount.value} 条规则`
})
const emptyDescription = computed(() => {
  if (loadFailed.value) return "动态路由加载失败，请关闭后重试"
  return props.workflowId ? "当前工作流尚未绑定工单模板" : "请先保存工作流"
})

const automationNodes = computed<AutomationNode[]>(() => {
  if (!props.automationNodeId) return []
  return [
    {
      id: props.automationNodeId,
      name: props.automationNodeName,
      codebook_id: props.codebookId,
      runner_id: props.defaultRunnerId || 0
    }
  ]
})

const parseTemplateRules = (rules: unknown): TemplateRuleNode[] => {
  if (typeof rules !== "string") return Array.isArray(rules) ? rules : []
  try {
    const parsed: unknown = JSON.parse(rules)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const fieldMap = computed(() => {
  const fields = new Map<string, string>()
  const visit = (nodes: TemplateRuleNode[]) => {
    nodes.forEach((node) => {
      if (node.type !== "fcRow" && node.type !== "col" && node.field) {
        fields.set(node.field, node.title || node.field)
      }
      if (Array.isArray(node.children)) visit(node.children)
    })
  }
  visit(parseTemplateRules(currentTemplate.value?.rules))
  return fields
})

const loadRuleList = async (templateId: number) => {
  const { data } = await listDispatchByTemplateIdApi({ template_id: templateId, offset: 0, limit: 1000 })
  dispatchesByTemplate.value.set(templateId, data.dispatches || [])
  dispatchesByTemplate.value = new Map(dispatchesByTemplate.value)
}

const loadWorkbench = async () => {
  templates.value = []
  dispatchesByTemplate.value = new Map()
  selectedTemplateId.value = undefined
  loadFailed.value = false
  if (!props.workflowId || !canView.value) return

  loading.value = true
  try {
    const { data } = await getTemplateByWorkflowIdApi(props.workflowId)
    templates.value = data.templates || []
    selectedTemplateId.value = templates.value[0]?.id
    await Promise.all(templates.value.map((item) => loadRuleList(item.id)))
  } catch (error) {
    console.error("加载动态路由失败:", error)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

const openWorkbench = () => {
  if (!canView.value) {
    ElMessage.warning("暂无查看动态路由权限")
    return
  }
  if (!props.codebookId) {
    ElMessage.warning("请先选择脚本文件")
    return
  }
  templateKeyword.value = ""
  ruleKeyword.value = ""
  workbenchVisible.value = true
  if (loadFailed.value) void loadWorkbench()
}

const openEditor = (rule?: dispatch) => {
  editingRule.value = rule
  editorVisible.value = true
  nextTick(() => {
    dispatchFormRef.value?.resetForm()
    if (rule) dispatchFormRef.value?.setForm(rule)
  })
}

const submitEditor = () => dispatchFormRef.value?.submitForm()
const closeEditor = () => {
  editorVisible.value = false
}
const resetEditor = () => {
  editingRule.value = undefined
  dispatchFormRef.value?.resetForm()
}

const handleRuleSaved = async () => {
  if (selectedTemplateId.value) await loadRuleList(selectedTemplateId.value)
}

const removeRule = async (rule: dispatch) => {
  const fallbackMessage = props.defaultRunnerId
    ? "删除后，命中该条件的任务将使用默认执行单元。"
    : "删除后，如果没有其他规则命中，任务将因缺少可用执行单元而失败。"
  await ElMessageBox.confirm(fallbackMessage, "删除路由规则", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消"
  })
  await deleteDispatchApi(rule.id)
  ElMessage.success("删除成功")
  if (selectedTemplateId.value) await loadRuleList(selectedTemplateId.value)
}

const getRunnerName = (runnerId: number) =>
  props.runners.find((item) => item.id === runnerId)?.name || `执行单元 #${runnerId}`
const getConditionText = (rule: dispatch) => `${fieldMap.value.get(rule.field) || rule.field} = ${rule.value}`
const getTemplateRuleCount = (templateId: number) =>
  (dispatchesByTemplate.value.get(templateId) || []).filter(
    (item) => item.automation_node_id === props.automationNodeId
  ).length

watch(() => props.workflowId, loadWorkbench)
onMounted(loadWorkbench)
</script>

<style scoped lang="scss">
.route-trigger {
  flex: none;
  margin-left: -1px;

  .el-button {
    height: 36px;
    padding: 0 16px;
    border-radius: 0 6px 6px 0;
  }

  :deep(.el-badge__content) {
    top: 2px;
    right: 8px;
  }
}

.route-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: #ffffff;
    background: #2563eb;
    border-radius: 8px;
    box-shadow: 0 6px 14px rgba(37, 99, 235, 0.22);
  }

  .header-text {
    min-width: 0;

    h3 {
      margin: 0 0 3px;
      color: #111827;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.3;
    }

    p {
      margin: 0;
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
    }
  }
}

.automation-route-dialog,
.route-panel-body,
.workbench-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.automation-route-dialog {
  background: #ffffff;
}

.route-panel-body {
  flex-direction: column;
  overflow: hidden;
}

.workbench-layout {
  background: #ffffff;
}

.template-panel {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 216px;
  min-height: 0;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
}

.template-search-input {
  flex-shrink: 0;
  padding: 12px 12px 10px;

  :deep(.el-input__wrapper) {
    min-height: 34px;
    padding: 0 10px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);

    &:hover {
      border-color: #cbd5e1;
    }

    &.is-focus {
      border-color: #93b4f8;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
    }
  }
}

.template-scrollbar {
  flex: 1;
  min-height: 0;
  padding: 0 10px 10px;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  color: #334155;
  font-size: 13px;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #eef2f7;
  }

  &.is-active {
    color: #1d4ed8;
    font-weight: 700;
    background: #eaf2ff;
  }
}

.template-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-count {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
}

.template-empty {
  padding: 32px 12px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}

.template-footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  min-height: 48px;
  padding: 8px 14px;
  color: #94a3b8;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.72);
  border-top: 1px solid #e2e8f0;
}

.rules-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 16px;
  background: #ffffff;
}

.rules-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
}

.rules-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;

  span {
    color: #1f2937;
    font-size: 14px;
    font-weight: 700;
  }

  small {
    overflow: hidden;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.rules-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.rule-search-input {
  width: 220px;

  :deep(.el-input__wrapper) {
    min-height: 34px;
    background: #f8fafc;
    border: 1px solid #d8e0eb;
    border-radius: 8px;
    box-shadow: none;

    &:hover,
    &.is-focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

.rules-scrollbar {
  flex: 1;
  min-height: 0;
}

.route-table {
  width: 100%;
}

.rules-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.condition-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  white-space: nowrap;
}

.condition-field,
.condition-value,
.runner-cell {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.condition-field {
  flex: 0 1 auto;
  max-width: 48%;
  color: #303133;
  font-weight: 500;
}

.condition-operator {
  flex-shrink: 0;
  margin: 0 8px;
  color: #a8abb2;
}

.condition-value {
  flex: 1;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;

  .el-button {
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 6px;
  }

  .el-button + .el-button {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .workbench-layout {
    flex-direction: column;
  }

  .template-panel {
    width: 100%;
    max-height: 220px;
    border-right: 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .rules-header {
    align-items: stretch;
    flex-direction: column;
  }

  .rules-actions,
  .rule-search-input {
    width: 100%;
  }
}
</style>

<style lang="scss">
body .base-dialog--custom:has(.automation-route-dialog) {
  .el-dialog__header {
    margin: 0;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
  }

  .el-dialog__headerbtn {
    top: 16px;
    right: 18px;
    width: 32px;
    height: 32px;
    border-radius: 8px;

    &:hover {
      background: #f1f5f9;
    }
  }

  .el-dialog__body {
    padding: 0 !important;
    background: #ffffff;
  }
}
</style>
