import { ref, computed, watch, type Ref } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  createAggregateRuleApi,
  listAggregateRoutesByWorkspaceApi,
  updateAggregateRuleApi,
  reorderAggregateRoutesApi,
  deleteAggregateRuleApi
} from "@/api/alert/aggregate"
import { AggregateType } from "@/api/alert/aggregate/types"
import type { AggregateGroupRule, SaveAggregateGroupRuleReq } from "@/api/alert/aggregate/types"

// 告警级别的全局共享常量配置
export const LEVEL_OPTIONS = [
  { label: "P0-紧急", value: 1 },
  { label: "P1-严重", value: 2 },
  { label: "P2-错误", value: 3 },
  { label: "P3-警告", value: 4 },
  { label: "P4-提示", value: 5 }
]

export const getLevelLabel = (lvl: number) => {
  return LEVEL_OPTIONS.find((o) => o.value === lvl)?.label || `P${lvl}`
}

/**
 * 聚合路由树生命周期状态及与后端 API 对接交互 Composable 逻辑层
 */
export function useAggregateRoutes(workspaceId: Ref<number>, emit: (event: "refresh") => void) {
  const loading = ref(false)
  const saving = ref(false)
  const routes = ref<AggregateGroupRule[]>([])
  const selectedRouteId = ref<number>()
  const isEditing = ref(false)
  const activeTab = ref("config")
  const sandboxPreviewing = ref(false)

  // 子组件的引用句柄，由 rules.vue 绑定到 template 上
  const routeFormRef = ref<any>()
  const previewSandboxRef = ref<any>()

  const createRouteForm = (parentId = 0): SaveAggregateGroupRuleReq => ({
    name: parentId ? "子聚合路由" : "默认聚合路由",
    type: AggregateType.Rule,
    parent_id: parentId,
    enabled: true,
    is_default: parentId === 0,
    priority: parentId ? nextPriority(parentId) : 0,
    levels: [],
    labels: parentId ? [] : ["alert_name"],
    workspace_id: workspaceId.value,
    is_diff_data_source: false,
    receivers: [],
    template_id: 0,
    ticket_policy: null,
    escalation_policy: null,
    matchers: [],
    group_wait: parentId ? 0 : 5,
    group_interval: parentId ? 0 : 30,
    repeat_interval: parentId ? 0 : 43200
  })

  const form = ref<SaveAggregateGroupRuleReq>(createRouteForm())

  const selectedRoute = computed(() => routes.value.find((route) => route.id === selectedRouteId.value))
  const currentEffective = computed(() => selectedRoute.value?.effective)
  const canAddChild = computed(() => !!selectedRoute.value?.id)

  const primaryAction = computed(() => ({
    label: "新增子路由",
    icon: null,
    capability: null,
    disabled: !canAddChild.value
  }))
  const handleTabChange = (tabName: string) => {
    activeTab.value = tabName
  }

  // 规范化路由对象，提供默认值兜底
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
      receivers: route.receivers || [],
      template_id: route.template_id || 0,
      ticket_policy: route.ticket_policy || null,
      escalation_policy: route.escalation_policy || null,
      matchers: route.matchers || [],
      group_wait: route.group_wait || 0,
      group_interval: route.group_interval || 0,
      repeat_interval: route.repeat_interval || 0,
      effective: route.effective
        ? {
            ...route.effective,
            group_by: route.effective.group_by || [],
            receivers: route.effective.receivers || [],
            template_id: route.effective.template_id || 0,
            ticket_policy: route.effective.ticket_policy || null,
            escalation_policy: route.effective.escalation_policy || null
          }
        : undefined
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
      receivers: (route.receivers || []).map((receiver) => ({ ...receiver, metadata: receiver.metadata || {} })),
      template_id: route.template_id || 0,
      ticket_policy: route.ticket_policy ? { ...route.ticket_policy } : null,
      escalation_policy: route.escalation_policy ? { ...route.escalation_policy } : null,
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

  async function loadRoutes() {
    if (!workspaceId.value) return
    loading.value = true
    try {
      const { data } = await listAggregateRoutesByWorkspaceApi(workspaceId.value)
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

  function handleSelectRoute(route: AggregateGroupRule) {
    selectedRouteId.value = route.id
    fillForm(normalizeRoute(route))
    activeTab.value = "config"
    isEditing.value = false
    previewSandboxRef.value?.resetSandbox()
  }

  async function handleReorderRoute(payload: {
    draggedRouteId: number
    targetParentId: number
    targetPosition: number
  }) {
    loading.value = true
    try {
      await reorderAggregateRoutesApi({
        workspace_id: workspaceId.value,
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
      workspace_id: workspaceId.value,
      name: (rawForm.name || "").trim(),
      labels: [...(rawForm.labels || [])],
      levels: [...(rawForm.levels || [])],
      receivers: (rawForm.receivers || []).filter((receiver) => receiver.id && receiver.type),
      template_id: rawForm.template_id || 0,
      ticket_policy: sanitizeTicketPolicy(rawForm.ticket_policy),
      escalation_policy: sanitizeEscalationPolicy(rawForm.escalation_policy),
      matchers
    }
  }

  function sanitizeTicketPolicy(policy: SaveAggregateGroupRuleReq["ticket_policy"]) {
    if (!policy) return null
    return {
      enabled: !!policy.enabled,
      template_id: policy.enabled ? policy.template_id || 0 : 0,
      duration: Math.max(0, Number(policy.duration || 0)),
      eval_count: Math.max(0, Number(policy.eval_count || 0)),
      mode: policy.mode || "ticket_only"
    }
  }

  function sanitizeEscalationPolicy(policy: SaveAggregateGroupRuleReq["escalation_policy"]) {
    if (!policy) return null
    return {
      enabled: !!policy.enabled,
      config_id: policy.enabled ? Number(policy.config_id || 0) : 0
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

  // 统一响应 workspaceId 外部变化
  watch(
    () => workspaceId.value,
    () => {
      resetForm(createRouteForm())
      selectedRouteId.value = undefined
      loadRoutes()
    },
    { immediate: true }
  )

  return {
    loading,
    saving,
    routes,
    selectedRouteId,
    isEditing,
    activeTab,
    sandboxPreviewing,
    form,
    selectedRoute,
    currentEffective,
    canAddChild,
    primaryAction,
    routeFormRef,
    previewSandboxRef,
    handleTabChange,
    loadRoutes,
    handleSelectRoute,
    handleReorderRoute,
    handleDeleteRoute,
    handleCreateRootRoute,
    handleAddChildRoute,
    handleCancelEdit,
    handleSaveRoute
  }
}
