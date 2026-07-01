import { computed, onMounted, ref, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  deletePluginApi,
  getPluginDetailApi,
  listPluginEnumsApi,
  listPluginsApi,
  togglePluginApi
} from "@/api/cmdb/plugin"
import {
  PLUGIN_DIRECTION,
  PLUGIN_RELATION_TYPE,
  type PluginDetail,
  type PluginListItem,
  type PluginManagementEnums
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

export const usePluginCenter = () => {
  const keyword = ref("")
  const pluginsLoading = ref(false)
  const detailLoading = ref(false)

  const plugins = ref<PluginListItem[]>([])
  const pluginEnums = ref<PluginManagementEnums | null>(null)
  const activePluginUid = ref("")
  const pluginDetail = ref<PluginDetail | null>(null)

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

  const enabledCount = computed(() => plugins.value.filter((item) => item.enabled).length)

  const activePluginCard = computed(() => {
    return filteredPlugins.value.find((item) => item.uid === activePluginUid.value) || filteredPlugins.value[0] || null
  })

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

  const resolveModelName = (modelUid?: string) => {
    if (!modelUid) return "-"
    return modelNameMap.value.get(modelUid) || modelUid
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
    activePluginUid.value = uid
  }

  const openDetailDrawer = async (uid: string) => {
    detailVisible.value = true
    detailLoading.value = true
    try {
      const { data } = await getPluginDetailApi(uid)
      pluginDetail.value = data
      activeBindingUid.value = data.bindings[0]?.uid || ""
    } catch (error) {
      console.error("[PluginPage] load detail failed", error)
      pluginDetail.value = null
      activeBindingUid.value = ""
    } finally {
      detailLoading.value = false
    }
  }

  const handleToggle = async (item: PluginListItem) => {
    try {
      await togglePluginApi(item.uid, !item.enabled)
      ElMessage.success(item.enabled ? "插件已停用" : "插件已启用")
      await loadPlugins()
      if (detailVisible.value && pluginDetail.value?.plugin.uid === item.uid) {
        await openDetailDrawer(item.uid)
      }
    } catch (error) {
      console.error("[PluginPage] toggle failed", error)
    }
  }

  const handleDelete = async (item: PluginListItem) => {
    try {
      await ElMessageBox.confirm(`确定删除插件 ${item.name} (${item.uid}) 吗？`, "删除插件", {
        type: "warning"
      })
      await deletePluginApi(item.uid)
      ElMessage.success("插件已删除")
      if (activePluginUid.value === item.uid) {
        activePluginUid.value = ""
      }
      if (pluginDetail.value?.plugin.uid === item.uid) {
        detailVisible.value = false
        pluginDetail.value = null
      }
      await loadPlugins()
    } catch (error) {
      if (error === "cancel") return
      console.error("[PluginPage] delete failed", error)
    }
  }

  watch(
    activePluginCard,
    async (plugin) => {
      if (!plugin) {
        pluginDetail.value = null
        activeBindingUid.value = ""
        return
      }

      if (pluginDetail.value?.plugin.uid === plugin.uid || detailLoading.value) {
        return
      }

      detailLoading.value = true
      try {
        const { data } = await getPluginDetailApi(plugin.uid)
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
    cardinalityLabelMap,
    detailLoading,
    detailVisible,
    directionLabelMap,
    enabledCount,
    filteredPlugins,
    formatJson,
    graphViewMode,
    handleDelete,
    handleToggle,
    keyword,
    loadPlugins,
    openDetailDrawer,
    pluginDetail,
    pluginEnums,
    pluginsLoading,
    relationLabelMap,
    resolveModelName,
    selectPlugin
  }
}
