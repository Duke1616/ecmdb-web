<template>
  <WorkspaceSectionPage
    title="聚合路由"
    subtitle="按路由树匹配告警，不同分支可独立声明分组标签和通知节奏"
    :flush-body="false"
    :primary-action="primaryAction"
    @primary-action="handleAddChildRoute"
  >
    <template #actions>
      <el-button v-if="!isEditing || activeTab === 'sandbox'" :icon="Refresh" :loading="loading" @click="loadRoutes"
        >刷新</el-button
      >

      <template v-if="activeTab === 'config' && !isEditing">
        <AuthButton
          :icon="Plus"
          :disabled="!canAddChild"
          :capability="ALERT_CAPABILITIES.Aggregate.Add"
          disable-mode
          @click="handleAddChildRoute"
        >
          新增子路由
        </AuthButton>
        <AuthButton
          v-if="form.id && !form.is_default"
          type="danger"
          :icon="Delete"
          :capability="ALERT_CAPABILITIES.Aggregate.Delete"
          disable-mode
          @click="handleDeleteRoute"
        >
          删除路由
        </AuthButton>
      </template>

      <el-button v-if="activeTab === 'config' && isEditing" @click="handleCancelEdit"> 取消 </el-button>

      <AuthButton
        type="primary"
        :icon="primaryBtn.icon"
        :loading="primaryBtn.loading"
        :capability="primaryBtn.capability"
        disable-mode
        @click="primaryBtn.click"
      >
        {{ primaryBtn.label }}
      </AuthButton>
    </template>

    <div class="aggregate-route-page" v-loading="loading">
      <div v-if="!loading && routes.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <h4 class="empty-title">暂无聚合路由</h4>
        <p class="empty-description">创建默认根路由后，即可继续添加不同场景的子路由</p>
        <AuthButton
          type="primary"
          :icon="Setting"
          :capability="ALERT_CAPABILITIES.Aggregate.Add"
          disable-mode
          @click="handleCreateRootRoute"
        >
          创建默认路由
        </AuthButton>
      </div>

      <div v-else class="route-workbench">
        <!-- 路由树组件 -->
        <RouteTree
          :routes="routes"
          :selected-route-id="selectedRouteId"
          @select="handleSelectRoute"
          @reorder="handleReorderRoute"
        />

        <main class="route-editor-panel">
          <div class="editor-title-bar">
            <h5>{{ form.id ? "编辑聚合路由" : form.parent_id ? "新增子路由" : "创建默认路由" }}</h5>
            <span v-if="currentParent" class="parent-info">父路由：{{ currentParent.name }}</span>
            <span v-else class="parent-info">根路由作为当前工作空间的默认聚合策略</span>
          </div>

          <el-tabs v-model="activeTab" class="editor-tabs">
            <!-- 路由配置模式 -->
            <el-tab-pane label="路由配置" name="config" class="tab-pane-content">
              <!-- 1. 只读查看模式 -->
              <template v-if="!isEditing && selectedRoute">
                <div class="route-read-view">
                  <!-- 匹配条件面板 -->
                  <section class="read-view-section">
                    <div class="read-view-section-title">
                      <el-icon><Filter /></el-icon>
                      <span>匹配条件</span>
                    </div>
                    <div class="read-view-content">
                      <div class="meta-field">
                        <span class="field-label">告警级别</span>
                        <div class="field-value">
                          <template v-if="selectedRoute.levels && selectedRoute.levels.length > 0">
                            <el-tag
                              v-for="lvl in selectedRoute.levels"
                              :key="lvl"
                              size="small"
                              type="info"
                              class="level-read-tag"
                            >
                              {{ getLevelLabel(lvl) }}
                            </el-tag>
                          </template>
                          <span v-else class="empty-field-text">不限级别 (默认匹配所有级别)</span>
                        </div>
                      </div>

                      <div class="meta-field">
                        <span class="field-label">标签匹配器</span>
                        <div class="field-value">
                          <template v-if="selectedRoute.matchers && selectedRoute.matchers.length > 0">
                            <div class="matcher-read-tags">
                              <el-tag
                                v-for="(m, i) in selectedRoute.matchers"
                                :key="i"
                                size="small"
                                effect="plain"
                                class="matcher-read-tag"
                              >
                                {{ formatMatcher(m) }}
                              </el-tag>
                            </div>
                          </template>
                          <span v-else class="empty-field-text">不限条件 (默认匹配所有告警)</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <!-- 最终生效配置组件 -->
                <RouteEffectiveConfig v-if="currentEffective" :effective="currentEffective" :routes="routes" />
              </template>

              <!-- 2. 编辑模式 -->
              <RouteConfigForm v-else-if="isEditing" ref="routeFormRef" :form="form" />
            </el-tab-pane>

            <!-- 沙箱验证模式 -->
            <el-tab-pane label="沙箱验证" name="sandbox" class="tab-pane-content">
              <!-- 沙箱验证组件 -->
              <RoutePreviewSandbox
                ref="previewSandboxRef"
                :workspace-id="workspaceId"
                :routes="routes"
                v-model:previewing="sandboxPreviewing"
              />
            </el-tab-pane>
          </el-tabs>
        </main>
      </div>
    </div>
  </WorkspaceSectionPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Check, Plus, Refresh, Setting, Search, Delete, Edit, Filter } from "@element-plus/icons-vue"
import {
  createAggregateRuleApi,
  listAggregateRoutesByWorkspaceApi,
  updateAggregateRuleApi,
  reorderAggregateRoutesApi,
  deleteAggregateRuleApi
} from "@/api/alert/aggregate"
import { AggregateType, type AggregateGroupRule, type SaveAggregateGroupRuleReq } from "@/api/alert/aggregate/types"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import { MATCH_TYPE_OPTIONS } from "@/common/constants/match-type"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import WorkspaceSectionPage from "../../WorkspaceSectionPage.vue"
import RouteTree from "./components/RouteTree.vue"
import RouteConfigForm from "./components/RouteConfigForm.vue"
import RouteEffectiveConfig from "./components/RouteEffectiveConfig.vue"
import RoutePreviewSandbox from "./components/RoutePreviewSandbox.vue"

const props = defineProps<{ workspaceId: number }>()

const emit = defineEmits<{
  refresh: []
}>()

const loading = ref(false)
const saving = ref(false)
const routes = ref<AggregateGroupRule[]>([])
const selectedRouteId = ref<number>()

// 子组件引用句柄
const routeFormRef = ref<InstanceType<typeof RouteConfigForm>>()
const previewSandboxRef = ref<InstanceType<typeof RoutePreviewSandbox>>()

const activeTab = ref("config")
const sandboxPreviewing = ref(false)
const isEditing = ref(false)

const primaryBtn = computed(() => {
  if (activeTab.value === "sandbox") {
    return {
      label: "执行验证",
      icon: Search,
      loading: sandboxPreviewing.value,
      capability: ALERT_CAPABILITIES.Aggregate.Add,
      click: () => previewSandboxRef.value?.handlePreview()
    }
  }

  if (!isEditing.value) {
    return {
      label: "编辑",
      icon: Edit,
      loading: false,
      capability: form.value.id ? ALERT_CAPABILITIES.Aggregate.Edit : ALERT_CAPABILITIES.Aggregate.Add,
      click: () => {
        isEditing.value = true
        if (selectedRoute.value) {
          fillForm(selectedRoute.value)
        }
      }
    }
  }

  return {
    label: "保存",
    icon: Check,
    loading: saving.value,
    capability: form.value.id ? ALERT_CAPABILITIES.Aggregate.Edit : ALERT_CAPABILITIES.Aggregate.Add,
    click: handleSaveRoute
  }
})

const createRouteForm = (parentId = 0): SaveAggregateGroupRuleReq => ({
  name: parentId ? "子聚合路由" : "默认聚合路由",
  type: AggregateType.Rule,
  parent_id: parentId,
  enabled: true,
  is_default: parentId === 0,
  priority: parentId ? nextPriority(parentId) : 0,
  levels: [],
  labels: parentId ? [] : ["alert_name"],
  workspace_id: props.workspaceId,
  is_diff_data_source: false,
  matchers: [],
  group_wait: parentId ? 0 : 5,
  group_interval: parentId ? 0 : 30,
  repeat_interval: parentId ? 0 : 43200
})

const form = ref<SaveAggregateGroupRuleReq>(createRouteForm())

const selectedRoute = computed(() => routes.value.find((route) => route.id === selectedRouteId.value))
const currentParent = computed(() => routes.value.find((route) => route.id === form.value.parent_id))
const currentEffective = computed(() => selectedRoute.value?.effective)
const canAddChild = computed(() => !!selectedRoute.value?.id)

const primaryAction = computed(() => ({
  label: "新增子路由",
  icon: Plus,
  capability: ALERT_CAPABILITIES.Aggregate.Add,
  disabled: !canAddChild.value
}))

watch(
  () => props.workspaceId,
  () => {
    resetForm(createRouteForm())
    selectedRouteId.value = undefined
    loadRoutes()
  },
  { immediate: true }
)

async function loadRoutes() {
  if (!props.workspaceId) return
  loading.value = true
  try {
    const { data } = await listAggregateRoutesByWorkspaceApi(props.workspaceId)
    routes.value = (data || []).map(normalizeRoute)

    const nextSelected =
      routes.value.find((route) => route.id === selectedRouteId.value) ||
      routes.value.find((route) => route.is_default && route.parent_id === 0) ||
      routes.value[0]

    if (nextSelected) {
      fillForm(nextSelected)
      selectedRouteId.value = nextSelected.id
      isEditing.value = false
    } else {
      resetForm(createRouteForm())
      selectedRouteId.value = undefined
      isEditing.value = true
    }
  } catch (error) {
    console.error("加载聚合路由失败:", error)
    ElMessage.error("加载聚合路由失败")
  } finally {
    loading.value = false
  }
}

function normalizeRoute(route: AggregateGroupRule): AggregateGroupRule {
  return {
    ...route,
    type: route.type || AggregateType.Rule,
    parent_id: route.parent_id || 0,
    enabled: route.enabled ?? true,
    is_default: route.is_default ?? false,
    priority: route.priority ?? 0,
    levels: route.levels || [],
    labels: route.labels || [],
    matchers: route.matchers || [],
    group_wait: route.group_wait || 0,
    group_interval: route.group_interval || 0,
    repeat_interval: route.repeat_interval || 0
  }
}

function fillForm(route: AggregateGroupRule) {
  form.value = {
    id: route.id,
    name: route.name,
    type: route.type,
    parent_id: route.parent_id,
    enabled: route.enabled,
    is_default: route.is_default,
    priority: route.priority,
    levels: [...route.levels],
    labels: [...route.labels],
    workspace_id: route.workspace_id,
    is_diff_data_source: route.is_diff_data_source,
    matchers: route.matchers.map((matcher) => ({ ...matcher })),
    group_wait: route.group_wait,
    group_interval: route.group_interval,
    repeat_interval: route.repeat_interval
  }
}

function resetForm(nextForm: SaveAggregateGroupRuleReq) {
  form.value = { ...nextForm }
  previewSandboxRef.value?.resetSandbox()
}

function nextPriority(parentId: number) {
  const children = routes.value.filter((route) => route.parent_id === parentId)
  if (!children.length) return 100
  return Math.max(...children.map((route) => route.priority || 0)) + 10
}

function handleSelectRoute(route: AggregateGroupRule) {
  selectedRouteId.value = route.id
  fillForm(normalizeRoute(route))
  activeTab.value = "config"
  isEditing.value = false
  previewSandboxRef.value?.resetSandbox()
}

async function handleReorderRoute(payload: { draggedRouteId: number; targetParentId: number; targetPosition: number }) {
  loading.value = true
  try {
    await reorderAggregateRoutesApi({
      workspace_id: props.workspaceId,
      dragged_route_id: payload.draggedRouteId,
      target_parent_id: payload.targetParentId,
      target_position: payload.targetPosition
    })
    ElMessage.success("排序已更新")
    await loadRoutes()
  } catch (error) {
    console.error("更新排序失败:", error)
    ElMessage.error("更新排序失败")
    await loadRoutes()
  } finally {
    loading.value = false
  }
}

function handleCreateRootRoute() {
  selectedRouteId.value = undefined
  resetForm(createRouteForm())
  activeTab.value = "config"
  isEditing.value = true
}

function handleAddChildRoute() {
  if (!selectedRoute.value) {
    ElMessage.warning("请先选择一个已保存的父路由")
    return
  }
  resetForm(createRouteForm(selectedRoute.value.id))
  activeTab.value = "config"
  isEditing.value = true
}

function handleCancelEdit() {
  isEditing.value = false
  if (selectedRoute.value) {
    fillForm(selectedRoute.value)
  } else {
    resetForm(createRouteForm())
  }
}

const getLevelLabel = (lvl: number) => {
  const levelOptions = [
    { label: "P0-紧急", value: 1 },
    { label: "P1-严重", value: 2 },
    { label: "P2-错误", value: 3 },
    { label: "P3-警告", value: 4 },
    { label: "P4-提示", value: 5 }
  ]
  return levelOptions.find((o) => o.value === lvl)?.label || `P${lvl}`
}

function formatMatcher(matcher: any) {
  const opt = MATCH_TYPE_OPTIONS.find((o) => o.value === matcher.type)
  if (!opt) return `${matcher.name} = ${matcher.value}`
  if (opt.requiresValue) {
    return `${matcher.name} ${opt.operatorText} "${matcher.value}"`
  }
  return `${matcher.name} ${opt.operatorText}`
}

function sanitizePayload(rawForm: SaveAggregateGroupRuleReq): SaveAggregateGroupRuleReq {
  const matchers = (rawForm.matchers || [])
    .map((matcher) => ({
      ...matcher,
      name: matcher.name.trim(),
      value: matcher.value.trim()
    }))
    .filter((matcher) => matcher.name || matcher.value)

  return {
    ...rawForm,
    workspace_id: props.workspaceId,
    name: (rawForm.name || "").trim(),
    labels: [...(rawForm.labels || [])],
    levels: [...(rawForm.levels || [])],
    matchers
  }
}

function validateMatchers(payload: SaveAggregateGroupRuleReq) {
  return payload.matchers.every((matcher) => matcher.name)
}

async function handleSaveRoute() {
  if (!routeFormRef.value) return
  const valid = await routeFormRef.value.validate()
  if (!valid) return

  const rawFormData = routeFormRef.value.getFormData()
  const payload = sanitizePayload(rawFormData)
  if (!validateMatchers(payload)) {
    ElMessage.warning("匹配器必须填写标签名")
    return
  }

  saving.value = true
  try {
    let savedRoute: AggregateGroupRule
    if (payload.id) {
      const { data } = await updateAggregateRuleApi(payload)
      savedRoute = data
      ElMessage.success("聚合路由已更新")
    } else {
      const { data } = await createAggregateRuleApi(payload)
      savedRoute = data
      ElMessage.success("聚合路由已创建")
    }

    await loadRoutes()
    const saved = routes.value.find((route) => route.id === savedRoute.id) || savedRoute
    if (saved) {
      selectedRouteId.value = saved.id
      fillForm(saved)
    }
    isEditing.value = false
    emit("refresh")
  } catch (error) {
    console.error("保存聚合路由失败:", error)
    ElMessage.error("保存聚合路由失败")
  } finally {
    saving.value = false
  }
}

async function handleDeleteRoute() {
  if (!form.value.id) return

  try {
    await ElMessageBox.confirm("此操作将一并删除该路由及其下的所有子路由，是否确认删除？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
  } catch {
    return
  }

  loading.value = true
  try {
    await deleteAggregateRuleApi(form.value.id)
    ElMessage.success("删除成功")
    selectedRouteId.value = undefined
    await loadRoutes()
    emit("refresh")
  } catch (error) {
    console.error("删除聚合路由失败:", error)
    ElMessage.error("删除聚合路由失败")
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.aggregate-route-page {
  display: flex;
  flex: 1;
  min-height: 0;
}

.empty-state {
  display: flex;
  flex: 1;
  min-height: 360px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 20px;
  text-align: center;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #ffffff;

  .empty-icon {
    margin-bottom: 14px;
    color: #94a3b8;
    font-size: 42px;
  }

  .empty-title {
    margin: 0 0 8px;
    color: #1f2937;
    font-size: 16px;
    font-weight: 700;
  }

  .empty-description {
    margin: 0 0 18px;
    color: #64748b;
    font-size: 13px;
  }
}

.route-workbench {
  display: grid;
  width: 100%;
  min-height: 0;
  grid-template-columns: minmax(200px, 260px) minmax(0, 1fr);
  border: 1px solid #e2e8f0;
  border-radius: 0;
  background: #ffffff;
  box-shadow:
    0 4px 20px -2px rgba(51, 65, 85, 0.05),
    0 2px 6px -1px rgba(51, 65, 85, 0.03);
  transition: box-shadow 0.3s ease;
  overflow: hidden;

  &:hover {
    box-shadow:
      0 10px 25px -3px rgba(51, 65, 85, 0.08),
      0 4px 12px -2px rgba(51, 65, 85, 0.04);
  }
}

.route-editor-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
}

.editor-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  flex-shrink: 0;

  h5 {
    margin: 0;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
  }

  .parent-info {
    color: #64748b;
    font-size: 11px;
  }
}

.editor-tabs {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  }

  :deep(.el-tabs__item) {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    height: 40px;
    line-height: 40px;
    transition: all 0.2s ease;

    &:hover {
      color: #3b82f6;
    }

    &.is-active {
      font-weight: 700;
      color: #2563eb;
    }
  }

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.tab-pane-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1024px) {
  .route-workbench {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .editor-header {
    align-items: stretch;
    flex-direction: column;
  }

  .editor-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}

.route-read-view {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.read-view-section {
  padding-bottom: 0px;

  .read-view-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
    position: relative;
    padding-left: 10px;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 14px;
      background: #3b82f6;
      border-radius: 2px;
    }

    .el-icon {
      color: #3b82f6;
      font-size: 14px;
    }
  }
}

.read-view-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0;
  padding: 16px;
}

.meta-field {
  display: flex;
  align-items: center;
  gap: 24px;

  .field-label {
    width: 90px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    flex-shrink: 0;
  }

  .field-value {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }
}

.level-read-tag {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  font-weight: 500;
}

.matcher-read-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.matcher-read-tag {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-weight: 500;
}

.empty-field-text {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}
</style>
