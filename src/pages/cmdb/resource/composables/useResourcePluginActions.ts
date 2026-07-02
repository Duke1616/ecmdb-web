import { computed, markRaw, ref } from "vue"
import { useRouter } from "vue-router"
import { Connection, FolderOpened, Monitor, Operation } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { listResourcePluginActionsBatchApi, resolvePluginActionApi } from "@/api/cmdb/plugin"
import { PLUGIN_UI, type ResourceAction, type ResolveResult } from "@/api/cmdb/plugin/types/plugin"
import type { Resource } from "@/api/cmdb/resource/types/resource"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"

const PLUGIN_ACTION_CODE_PREFIX = "plugin:"

type PluginOperateItem = {
  name: string
  code: string
  type: "primary" | "warning" | "danger" | "info"
  icon: unknown
  capability: string
}

type ResourceLike = Pick<Resource, "id" | "name" | "model_uid">

const builtinConnectionTypes: Record<string, string> = {
  [PLUGIN_UI.BuiltinTerminal]: "Web Shell",
  [PLUGIN_UI.BuiltinSFTP]: "Web Sftp"
}

const pluginIconMap: Record<string, unknown> = {
  terminal: markRaw(Monitor),
  shell: markRaw(Monitor),
  folder: markRaw(FolderOpened),
  sftp: markRaw(FolderOpened),
  connection: markRaw(Connection)
}

const toPluginActionCode = (action: ResourceAction) => {
  return `${PLUGIN_ACTION_CODE_PREFIX}${action.plugin_id}:${action.action}`
}

const getPluginIcon = (action: ResourceAction) => {
  const icon = action.icon?.toLowerCase()
  if (icon && pluginIconMap[icon]) return pluginIconMap[icon]
  if (action.ui === PLUGIN_UI.BuiltinTerminal) return markRaw(Monitor)
  if (action.ui === PLUGIN_UI.BuiltinSFTP) return markRaw(FolderOpened)
  return markRaw(Operation)
}

const openBuiltinUI = (router: ReturnType<typeof useRouter>, result: ResolveResult, resourceName?: string) => {
  const connectionType = result.ui ? builtinConnectionTypes[result.ui] : ""
  if (!connectionType) {
    ElMessage.warning("当前插件 UI 暂未支持")
    return
  }

  const terminalRoute = router.resolve({
    name: "AssetTerminal",
    query: {
      resource_id: String(result.resource_id),
      title: resourceName || result.plugin_name,
      connection_type: connectionType,
      auto_connect: "1",
      plugin_id: result.plugin_id,
      plugin_action: result.action
    }
  })
  window.open(terminalRoute.href, "_blank")
}

export const useResourcePluginActions = () => {
  const router = useRouter()
  const pluginActionsByResourceID = ref<Record<number, ResourceAction[]>>({})
  const pluginActionsLoading = ref(false)

  const toOperateItems = (actions: ResourceAction[]): PluginOperateItem[] => {
    return actions.map((action) => ({
      name: action.name,
      code: toPluginActionCode(action),
      type: "info",
      icon: getPluginIcon(action),
      capability: CMDB_CAPABILITIES.Plugin.Resolve
    }))
  }

  const getPluginActions = (resourceID: number) => {
    return pluginActionsByResourceID.value[resourceID] || []
  }

  const getPluginOperateItems = (resourceID: number) => {
    return toOperateItems(getPluginActions(resourceID))
  }

  const loadResourcePluginActions = async (resources: ResourceLike[]) => {
    if (resources.length === 0) {
      pluginActionsByResourceID.value = {}
      return
    }

    pluginActionsLoading.value = true
    try {
      const { data } = await listResourcePluginActionsBatchApi({
        resource_ids: resources.map((resource) => resource.id)
      })

      const actionMap = Object.fromEntries(
        resources.map((resource) => [resource.id, [] as ResourceAction[]])
      ) as Record<number, ResourceAction[]>

      for (const item of data || []) {
        actionMap[item.resource_id] = item.actions || []
      }

      pluginActionsByResourceID.value = actionMap
    } catch (error) {
      console.error("批量查询资源插件动作失败:", error)
      pluginActionsByResourceID.value = Object.fromEntries(
        resources.map((resource) => [resource.id, [] as ResourceAction[]])
      )
    } finally {
      pluginActionsLoading.value = false
    }
  }

  const isPluginActionCode = (code: string) => {
    return code.startsWith(PLUGIN_ACTION_CODE_PREFIX)
  }

  const findPluginAction = (resourceID: number, code: string) => {
    return getPluginActions(resourceID).find((action) => toPluginActionCode(action) === code)
  }

  const handlePluginAction = async (resource: ResourceLike, code: string) => {
    const action = findPluginAction(resource.id, code)
    if (!action) {
      ElMessage.warning("插件动作不存在或已失效")
      return
    }

    try {
      const { data } = await resolvePluginActionApi({
        plugin_id: action.plugin_id,
        action: action.action,
        resource_id: resource.id
      })
      openBuiltinUI(router, data, resource.name)
    } catch (error) {
      console.error("解析插件动作失败:", error)
    }
  }

  const resourcePluginActions = computed(() => pluginActionsByResourceID.value)

  return {
    pluginActionsLoading,
    resourcePluginActions,
    getPluginActions,
    getPluginOperateItems,
    loadResourcePluginActions,
    isPluginActionCode,
    handlePluginAction,
    toOperateItems
  }
}
