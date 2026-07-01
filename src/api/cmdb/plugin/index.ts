import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"
import type * as Plugin from "./types/plugin"

/** 查询插件目录 */
export function listPluginsApi() {
  return instance.get<Plugin.PluginListResponse>({
    url: `${API_SERVICE.CMDB}/plugin/list`
  })
}

/** 查询插件详情 */
export function getPluginDetailApi(uid: string) {
  return instance.get<Plugin.PluginDetail>({
    url: `${API_SERVICE.CMDB}/plugin/detail`,
    params: { uid }
  })
}

/** 查询插件管理枚举 */
export function listPluginEnumsApi() {
  return instance.get<Plugin.PluginManagementEnums>({
    url: `${API_SERVICE.CMDB}/plugin/enums`
  })
}

/** 注册完整插件定义 */
export function registerPluginDefinitionApi(data: Plugin.Definition) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/plugin/definition/register`,
    data
  })
}

/** 保存插件定义 */
export function upsertPluginApi(data: Plugin.Plugin) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/plugin/definition/upsert`,
    data
  })
}

/** 保存插件绑定 */
export function upsertPluginBindingApi(data: Plugin.Binding) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/plugin/binding/upsert`,
    data
  })
}

/** 切换插件状态 */
export function togglePluginApi(uid: string, enabled: boolean) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/plugin/toggle`,
    data: { uid, enabled }
  })
}

/** 删除插件 */
export function deletePluginApi(uid: string) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/plugin/delete`,
    data: { uid }
  })
}

/** 查询资源可用插件动作 */
export function listResourcePluginActionsApi(resource_id: number) {
  return instance.get<Plugin.ResourceAction[]>({
    url: `${API_SERVICE.CMDB}/plugin/resource/actions`,
    params: { resource_id }
  })
}

/** 查询模型可用插件动作 */
export function listModelPluginActionsApi(model_uid: string) {
  return instance.get<Plugin.ResourceAction[]>({
    url: `${API_SERVICE.CMDB}/plugin/model/actions`,
    params: { model_uid }
  })
}

/** 解析插件动作 */
export function resolvePluginActionApi(data: Plugin.ResolveRequest) {
  return instance.post<Plugin.ResolveResult>({
    url: `${API_SERVICE.CMDB}/plugin/action/resolve`,
    data
  })
}
