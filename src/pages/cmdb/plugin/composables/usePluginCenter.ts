import { computed, onMounted, ref, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  deletePluginBindingApi,
  getDefaultPluginDefinitionApi,
  getPluginDetailApi,
  listPluginEnumsApi,
  listPluginsApi,
  savePluginBindingsApi,
  switchPluginBindingStatusApi
} from "@/api/cmdb/plugin"
import {
  PLUGIN_DIRECTION,
  PLUGIN_RELATION_TYPE,
  type Binding,
  type BindingGraph,
  type BindingGraphNode,
  type FieldMapping,
  type Definition,
  type PluginDetail,
  type PluginListItem,
  type PluginManagementEnums,
  type PluginModelOption
} from "@/api/cmdb/plugin/types/plugin"

const directionLabelMap: Record<string, string> = {
  [PLUGIN_DIRECTION.Source]: "源端关联",
  [PLUGIN_DIRECTION.Target]: "目标端关联"
}

const relationLabelMap: Record<string, string> = {
  [PLUGIN_RELATION_TYPE.Default]: "默认关系",
  [PLUGIN_RELATION_TYPE.Group]: "分组关系",
  [PLUGIN_RELATION_TYPE.Belong]: "归属关系",
  [PLUGIN_RELATION_TYPE.Run]: "运行关系"
}

const cardinalityLabelMap: Record<string, string> = {
  one: "单个资源",
  many: "多个资源"
}

const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)

const TEMPLATE_MODEL_GROUP = "保存后自动创建"

export const usePluginCenter = () => {
  const keyword = ref("")
  const pluginsLoading = ref(false)
  const detailLoading = ref(false)
  const savingDefaultBindingDraft = ref(false)
  const savingBindingEdit = ref(false)
  const togglingBindingEnabled = ref(false)
  const deletingBinding = ref(false)

  const plugins = ref<PluginListItem[]>([])
  const pluginEnums = ref<PluginManagementEnums | null>(null)
  const activePluginUid = ref("")
  const pluginDetail = ref<PluginDetail | null>(null)
  const pendingDefaultSchemaPluginUid = ref("")
  const editingBindingPluginUid = ref("")
  const bindingEditSnapshot = ref<PluginDetail | null>(null)
  const bindingEditActiveBindingUid = ref("")

  const detailVisible = ref(false)
  const activeBindingUid = ref("")
  const graphViewMode = ref<"binding" | "action">("binding")

  const filteredPlugins = computed(() => {
    const search = keyword.value.trim().toLowerCase()
    if (!search) return plugins.value
    return plugins.value.filter((item) => {
      const modelText = item.bound_models.map((model) => `${model.name} ${model.uid}`).join(" ")
      return `${item.name} ${item.uid} ${item.type} ${modelText}`.toLowerCase().includes(search)
    })
  })

  const activePluginCard = computed(() => {
    return filteredPlugins.value.find((item) => item.uid === activePluginUid.value) || filteredPlugins.value[0] || null
  })

  const hasDefaultSchemaPreview = computed(
    () => Boolean(activePluginCard.value?.uid) && pendingDefaultSchemaPluginUid.value === activePluginCard.value?.uid
  )

  const hasBindingEditDraft = computed(
    () => Boolean(activePluginCard.value?.uid) && editingBindingPluginUid.value === activePluginCard.value?.uid
  )

  const isTopologyEditable = computed(() => hasDefaultSchemaPreview.value || hasBindingEditDraft.value)

  const modelNameMap = computed(() => {
    const map = new Map<string, string>()

    for (const plugin of plugins.value) {
      for (const model of plugin.bound_models) {
        if (model.uid) {
          map.set(model.uid, model.name || model.uid)
        }
      }
    }

    for (const binding of pluginDetail.value?.bindings || []) {
      if (binding.model_uid) {
        map.set(binding.model_uid, binding.model_name || binding.model_uid)
      }
    }

    for (const model of pluginEnums.value?.models || []) {
      if (model.uid) {
        map.set(model.uid, model.name || model.uid)
      }
    }

    return map
  })

  const activeBindingDetail = computed(() => {
    const bindings = pluginDetail.value?.bindings || []
    if (!bindings.length) return null
    return bindings.find((item) => item.uid === activeBindingUid.value) || bindings[0]
  })

  const collectGraphModelUids = (graph: BindingGraph | undefined, collector: Set<string>) => {
    graph?.nodes?.forEach((node) => {
      if (node.model_uid) {
        collector.add(node.model_uid)
      }
    })
  }

  const modelOptions = computed<PluginModelOption[]>(() => {
    const map = new Map<string, PluginModelOption>()

    for (const model of pluginEnums.value?.models || []) {
      map.set(model.uid, model)
    }

    const draftModelUids = new Set<string>()
    for (const binding of pluginDetail.value?.bindings || []) {
      if (binding.model_uid) {
        draftModelUids.add(binding.model_uid)
      }
      collectGraphModelUids(binding.graph, draftModelUids)
    }

    for (const uid of draftModelUids) {
      if (!map.has(uid)) {
        map.set(uid, {
          uid,
          name: uid,
          group_name: TEMPLATE_MODEL_GROUP,
          builtin: false
        })
      }
    }

    return Array.from(map.values())
  })

  const resolveModelName = (modelUid?: string) => {
    if (!modelUid) return "-"
    return modelNameMap.value.get(modelUid) || modelUid
  }

  const resolveModelOption = (modelUid?: string) => {
    if (!modelUid) return null
    return modelOptions.value.find((item) => item.uid === modelUid) || null
  }

  const buildDefinitionModelMap = (definition: Definition) => {
    const map = new Map<string, PluginModelOption>()

    for (const model of definition.schema?.models || []) {
      map.set(model.uid, {
        uid: model.uid,
        name: model.name || model.uid,
        group_name: model.group_name,
        icon: model.icon,
        builtin: model.builtin ?? false
      })
    }

    for (const model of pluginEnums.value?.models || []) {
      if (!map.has(model.uid)) {
        map.set(model.uid, model)
      }
    }

    return map
  }

  const buildBindingUid = (pluginUid: string, modelUid: string) => {
    const normalized = modelUid.trim().replace(/[^a-zA-Z0-9_.-]/g, "-")
    return `${pluginUid}.${normalized || "binding"}`
  }

  const buildUniqueBindingUid = (
    pluginUid: string,
    modelUid: string,
    existingUids: Set<string>,
    currentUid?: string
  ) => {
    const baseUid = buildBindingUid(pluginUid, modelUid)
    if ((!currentUid || currentUid === baseUid) && !existingUids.has(baseUid)) {
      return baseUid
    }
    if (currentUid && currentUid === baseUid && existingUids.size === 1 && existingUids.has(baseUid)) {
      return baseUid
    }

    let index = 2
    let nextUid = `${baseUid}.${index}`
    while (existingUids.has(nextUid) && nextUid !== currentUid) {
      index += 1
      nextUid = `${baseUid}.${index}`
    }
    return nextUid
  }

  const cloneBinding = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

  const getEntryNode = (graph?: BindingGraph) => {
    if (!graph?.entry_node_id) return null
    return graph.nodes.find((node) => node.id === graph.entry_node_id) || null
  }

  const ensureActivePlugin = () => {
    const exists = filteredPlugins.value.some((item) => item.uid === activePluginUid.value)
    if (!exists) {
      activePluginUid.value = filteredPlugins.value[0]?.uid || ""
    }
  }

  const loadPluginEnums = async () => {
    try {
      const { data } = await listPluginEnumsApi()
      pluginEnums.value = data
    } catch (error) {
      console.error("[PluginPage] load enums failed", error)
    }
  }

  const loadPlugins = async () => {
    pluginsLoading.value = true
    try {
      const { data } = await listPluginsApi()
      plugins.value = data.list || []
      ensureActivePlugin()
    } catch (error) {
      console.error("[PluginPage] load plugins failed", error)
    } finally {
      pluginsLoading.value = false
    }
  }

  const selectPlugin = (uid: string) => {
    if (activePluginUid.value !== uid) {
      pendingDefaultSchemaPluginUid.value = ""
      editingBindingPluginUid.value = ""
      bindingEditSnapshot.value = null
      bindingEditActiveBindingUid.value = ""
    }
    activePluginUid.value = uid
  }

  const fetchPluginDetail = async (uid: string) => {
    const { data } = await getPluginDetailApi(uid)
    return data
  }

  const loadDefaultSchemaPreview = async (item: PluginListItem) => {
    let definition: Definition
    try {
      const { data } = await getDefaultPluginDefinitionApi(item.uid)
      definition = data
    } catch (error) {
      console.error("[PluginPage] load default definition failed", error)
      ElMessage.warning("当前插件没有可加载的默认绑定模板")
      return
    }

    const definitionModels = buildDefinitionModelMap(definition)

    const toPreviewBinding = (binding: Binding) => {
      const model = definitionModels.get(binding.model_uid)
      return {
        id: binding.id || 0,
        uid: binding.uid,
        plugin_id: binding.plugin_id,
        model_uid: binding.model_uid,
        model_name: model?.name || binding.model_uid,
        group_name: model?.group_name,
        model_icon: model?.icon,
        enabled: binding.enabled,
        graph: cloneBinding(binding.graph)
      }
    }

    let currentDetail: PluginDetail
    try {
      currentDetail =
        pluginDetail.value?.plugin.uid === item.uid
          ? cloneBinding(pluginDetail.value)
          : await fetchPluginDetail(item.uid)
    } catch (error) {
      console.error("[PluginPage] load current detail failed", error)
      ElMessage.error("加载当前绑定失败，暂时无法新增绑定")
      return
    }

    const existingBindingUids = new Set(currentDetail.bindings.map((binding) => binding.uid))
    const previewBindings = definition.bindings.map(toPreviewBinding)
    const appendedBindings = previewBindings.map((binding) => {
      const nextUid = buildUniqueBindingUid(item.uid, binding.model_uid, existingBindingUids)
      existingBindingUids.add(nextUid)
      return {
        ...binding,
        id: 0,
        uid: nextUid
      }
    })

    pluginDetail.value = {
      plugin: {
        ...currentDetail.plugin,
        id: currentDetail.plugin.id || item.id
      },
      bindings: [...currentDetail.bindings, ...appendedBindings]
    }
    activeBindingUid.value = appendedBindings[0]?.uid || currentDetail.bindings[0]?.uid || ""
    pendingDefaultSchemaPluginUid.value = item.uid
    detailVisible.value = false
    ElMessage.success("默认绑定模板已导入，可基于模板继续修改后保存")
  }

  const cancelDefaultSchemaPreview = async (uid?: string) => {
    if (!hasDefaultSchemaPreview.value) return

    try {
      await ElMessageBox.confirm(
        "将放弃当前未保存的模型草稿，并恢复为数据库中的绑定详情。确定取消吗？",
        "取消模型草稿",
        {
          confirmButtonText: "取消草稿",
          cancelButtonText: "继续编辑",
          type: "warning"
        }
      )
    } catch (error) {
      if (error === "cancel" || error === "close") return
      throw error
    }

    const pluginUid = uid || activePluginCard.value?.uid
    pendingDefaultSchemaPluginUid.value = ""
    detailVisible.value = false

    if (pluginUid) {
      await refreshPluginDetail(pluginUid)
    } else {
      pluginDetail.value = null
      activeBindingUid.value = ""
    }
    ElMessage.success("已取消模型草稿")
  }

  const startBindingEdit = async (uid?: string) => {
    const pluginUid = uid || activePluginCard.value?.uid
    if (!pluginUid) return
    if (!pluginDetail.value || pluginDetail.value.plugin.uid !== pluginUid) {
      await refreshPluginDetail(pluginUid)
    }
    if (!pluginDetail.value) return

    bindingEditSnapshot.value = cloneBinding(pluginDetail.value)
    bindingEditActiveBindingUid.value = activeBindingUid.value
    editingBindingPluginUid.value = pluginUid
    detailVisible.value = false
    ElMessage.success("已进入绑定编辑模式")
  }

  const cancelBindingEdit = async () => {
    if (!hasBindingEditDraft.value) return
    try {
      await ElMessageBox.confirm("将放弃当前未保存的绑定修改。确定取消吗？", "取消绑定编辑", {
        confirmButtonText: "取消编辑",
        cancelButtonText: "继续编辑",
        type: "warning"
      })
    } catch (error) {
      if (error === "cancel" || error === "close") return
      throw error
    }

    if (bindingEditSnapshot.value) {
      pluginDetail.value = cloneBinding(bindingEditSnapshot.value)
      activeBindingUid.value = bindingEditActiveBindingUid.value || pluginDetail.value.bindings[0]?.uid || ""
    }
    editingBindingPluginUid.value = ""
    bindingEditSnapshot.value = null
    bindingEditActiveBindingUid.value = ""
    detailVisible.value = false
    ElMessage.success("已取消绑定编辑")
  }

  const toBindingPayload = (binding: PluginDetail["bindings"][number]): Binding => ({
    id: binding.id || undefined,
    uid: binding.uid,
    plugin_id: binding.plugin_id,
    model_uid: binding.model_uid,
    enabled: binding.enabled,
    graph: cloneBinding(binding.graph)
  })

  const saveBindingEdit = async () => {
    if (!hasBindingEditDraft.value || !pluginDetail.value) return
    const pluginUid = pluginDetail.value.plugin.uid
    try {
      savingBindingEdit.value = true
      await ElMessageBox.confirm("将保存当前插件绑定修改，保存后会立即写入数据库。确定继续吗？", "保存绑定编辑", {
        confirmButtonText: "保存",
        cancelButtonText: "取消",
        type: "warning"
      })

      await savePluginBindingsApi({
        plugin_id: pluginUid,
        bindings: pluginDetail.value.bindings.map(toBindingPayload)
      })
      ElMessage.success("绑定修改已保存")
      const nextActiveBindingUid = activeBindingUid.value
      editingBindingPluginUid.value = ""
      bindingEditSnapshot.value = null
      bindingEditActiveBindingUid.value = ""
      await loadPlugins()
      await refreshPluginDetail(pluginUid)
      if (pluginDetail.value?.bindings.some((binding) => binding.uid === nextActiveBindingUid)) {
        activeBindingUid.value = nextActiveBindingUid
      }
    } catch (error) {
      if (error === "cancel") return
      console.error("[PluginPage] save binding edit failed", error)
      ElMessage.error("绑定修改保存失败")
    } finally {
      savingBindingEdit.value = false
    }
  }

  const updateDraftBindingModel = (bindingUid: string, modelUid: string) => {
    if (!isTopologyEditable.value || !pluginDetail.value) return
    const binding = pluginDetail.value.bindings.find((item) => item.uid === bindingUid)
    const model = resolveModelOption(modelUid)
    if (!binding || !model) return

    if (isTopologyEditable.value) {
      const existingUids = new Set(
        pluginDetail.value.bindings.filter((item) => item.uid !== bindingUid).map((item) => item.uid)
      )
      const nextUid = buildUniqueBindingUid(binding.plugin_id, model.uid, existingUids, binding.uid)
      binding.uid = nextUid
      activeBindingUid.value = nextUid
    }
    binding.model_uid = model.uid
    binding.model_name = model.name || model.uid
    binding.group_name = model.group_name
    binding.model_icon = model.icon
    const entryNode = getEntryNode(binding.graph)
    if (entryNode) {
      entryNode.model_uid = model.uid
    }
  }

  const updateDraftGraphNode = (node: BindingGraphNode, patch: Partial<BindingGraphNode>) => {
    if (!isTopologyEditable.value) return
    Object.assign(node, patch)
  }

  const updateDraftFieldMapping = (node: BindingGraphNode, input: string, nextValue: string) => {
    if (!isTopologyEditable.value) return
    node.field_mappings = (node.field_mappings || []).map((mapping): FieldMapping => {
      if (mapping.input !== input) return mapping
      return {
        ...mapping,
        resource_field: nextValue
      }
    })
  }

  const refreshPluginDetail = async (uid: string) => {
    detailLoading.value = true
    try {
      const data = await fetchPluginDetail(uid)
      pluginDetail.value = data
      activeBindingUid.value = data.bindings[0]?.uid || ""
    } catch (error) {
      console.error("[PluginPage] refresh detail failed", error)
    } finally {
      detailLoading.value = false
    }
  }

  const openDetailDrawer = async (uid: string) => {
    detailVisible.value = true
    await refreshPluginDetail(uid)
  }

  const toggleActiveBindingEnabled = async () => {
    const binding = activeBindingDetail.value
    if (!binding || hasDefaultSchemaPreview.value || hasBindingEditDraft.value) {
      return false
    }

    try {
      togglingBindingEnabled.value = true
      const { data } = await switchPluginBindingStatusApi(binding.uid)

      const target = pluginDetail.value?.bindings.find((item) => item.uid === binding.uid)
      if (target) {
        target.enabled = data.enabled
      }
      ElMessage.success(data.enabled ? "绑定已启用" : "绑定已停用")
      return true
    } catch (error) {
      console.error("[PluginPage] toggle binding enabled failed", error)
      ElMessage.error("绑定状态更新失败")
      return false
    } finally {
      togglingBindingEnabled.value = false
    }
  }

  const deleteActiveBinding = async () => {
    const binding = activeBindingDetail.value
    const pluginUid = activePluginCard.value?.uid || pluginDetail.value?.plugin.uid
    if (!binding || !pluginUid || hasDefaultSchemaPreview.value || hasBindingEditDraft.value) {
      return
    }

    const bindings = pluginDetail.value?.bindings || []
    const currentIndex = bindings.findIndex((item) => item.uid === binding.uid)
    const fallbackBindingUid = bindings[currentIndex - 1]?.uid || bindings[currentIndex + 1]?.uid || ""

    try {
      await ElMessageBox.confirm(
        `将删除当前绑定「${binding.model_name || binding.model_uid}」，删除后需要重新新增才会恢复。确定继续吗？`,
        "删除绑定",
        {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
    } catch (error) {
      if (error === "cancel" || error === "close") return
      throw error
    }

    try {
      deletingBinding.value = true
      await deletePluginBindingApi(binding.uid)
      ElMessage.success("绑定已删除")
      detailVisible.value = false
      await loadPlugins()
      await refreshPluginDetail(pluginUid)

      if (fallbackBindingUid && pluginDetail.value?.bindings.some((item) => item.uid === fallbackBindingUid)) {
        activeBindingUid.value = fallbackBindingUid
      } else {
        activeBindingUid.value = pluginDetail.value?.bindings[0]?.uid || ""
      }
    } catch (error) {
      console.error("[PluginPage] delete binding failed", error)
      ElMessage.error("删除绑定失败")
    } finally {
      deletingBinding.value = false
    }
  }

  const handleDefaultBindingDraft = async (item: PluginListItem) => {
    if (pendingDefaultSchemaPluginUid.value !== item.uid) {
      await loadDefaultSchemaPreview(item)
      return
    }

    try {
      savingDefaultBindingDraft.value = true
      if (!pluginDetail.value) {
        ElMessage.warning("没有可保存的模型草稿")
        return
      }

      await ElMessageBox.confirm("将按当前图谱草稿保存插件模型绑定，保存后会写入数据库。确定继续吗？", "保存模型草稿", {
        confirmButtonText: "保存",
        cancelButtonText: "取消",
        type: "warning"
      })

      await savePluginBindingsApi({
        plugin_id: item.uid,
        bindings: pluginDetail.value.bindings.map((binding) => ({
          id: binding.id || undefined,
          uid: binding.uid,
          plugin_id: binding.plugin_id,
          model_uid: binding.model_uid,
          enabled: binding.enabled,
          graph: cloneBinding(binding.graph)
        }))
      })
      ElMessage.success("模型绑定草稿已保存")
      pendingDefaultSchemaPluginUid.value = ""
      await loadPlugins()
      await refreshPluginDetail(item.uid)
    } catch (error) {
      if (error === "cancel") return
      console.error("[PluginPage] save default schema draft failed", error)
      ElMessage.error("模型草稿保存失败")
    } finally {
      savingDefaultBindingDraft.value = false
    }
  }

  watch(
    activePluginCard,
    async (plugin) => {
      if (!plugin) {
        pluginDetail.value = null
        activeBindingUid.value = ""
        pendingDefaultSchemaPluginUid.value = ""
        editingBindingPluginUid.value = ""
        bindingEditSnapshot.value = null
        bindingEditActiveBindingUid.value = ""
        return
      }

      if (pendingDefaultSchemaPluginUid.value === plugin.uid || editingBindingPluginUid.value === plugin.uid) {
        return
      }

      if (pluginDetail.value?.plugin.uid === plugin.uid || detailLoading.value) {
        return
      }

      detailLoading.value = true
      try {
        const data = await fetchPluginDetail(plugin.uid)
        pluginDetail.value = data
        activeBindingUid.value = data.bindings[0]?.uid || ""
      } catch (error) {
        console.error("[PluginPage] preload detail failed", error)
        pluginDetail.value = null
        activeBindingUid.value = ""
      } finally {
        detailLoading.value = false
      }
    },
    { immediate: true }
  )

  watch(
    filteredPlugins,
    () => {
      ensureActivePlugin()
    },
    { deep: true }
  )

  onMounted(async () => {
    await Promise.all([loadPlugins(), loadPluginEnums()])
  })

  return {
    activeBindingDetail,
    activeBindingUid,
    activePluginCard,
    activePluginUid,
    cancelDefaultSchemaPreview,
    cancelBindingEdit,
    cardinalityLabelMap,
    detailLoading,
    detailVisible,
    deleteActiveBinding,
    deletingBinding,
    directionLabelMap,
    filteredPlugins,
    formatJson,
    graphViewMode,
    handleDefaultBindingDraft,
    hasBindingEditDraft,
    hasDefaultSchemaPreview,
    isTopologyEditable,
    keyword,
    loadPlugins,
    openDetailDrawer,
    pluginDetail,
    pluginEnums,
    modelOptions,
    pluginsLoading,
    relationLabelMap,
    resolveModelName,
    selectPlugin,
    saveBindingEdit,
    savingBindingEdit,
    startBindingEdit,
    savingDefaultBindingDraft,
    toggleActiveBindingEnabled,
    togglingBindingEnabled,
    updateDraftBindingModel,
    updateDraftFieldMapping,
    updateDraftGraphNode
  }
}
