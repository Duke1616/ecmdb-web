import { computed, markRaw, ref } from "vue"
import { useRouter } from "vue-router"
import { Connection, FolderOpened, Monitor, Operation } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { listResourcePluginActionsBatchApi } from "@/api/cmdb/plugin"
import type { ResourceAction } from "@/api/cmdb/plugin/types/plugin"
import type { Resource } from "@/api/cmdb/resource/types/resource"

const PLUGIN_ACTION_CODE_PREFIX = "plugin:"

type PluginOperateItem = {
  name: string
  code: string
  type: "primary" | "warning" | "danger" | "info"
  icon: unknown
  capability?: string
}

type ResourceLike = Pick<Resource, "id" | "name" | "model_uid">

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
  return markRaw(Operation)
}

const openPluginRuntime = (router: ReturnType<typeof useRouter>, action: ResourceAction, resourceID: number) => {
  const runtimeRoute = router.resolve({
    name: "PluginRuntime",
    query: {
      resource_id: String(resourceID),
      plugin_id: action.plugin_id,
      action: action.action
    }
  })
  window.open(runtimeRoute.href, "_blank")
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
      icon: getPluginIcon(action)
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

    openPluginRuntime(router, action, resource.id)
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
