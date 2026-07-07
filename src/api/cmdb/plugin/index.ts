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

/** 查询插件默认定义 */
export function getDefaultPluginDefinitionApi(plugin_id: string) {
  return instance.get<Plugin.Definition>({
    url: `${API_SERVICE.CMDB}/plugin/definition/default`,
    params: { plugin_id }
  })
}

/** 保存插件绑定 */
export function savePluginBindingsApi(data: Plugin.SavePluginBindingsRequest) {
  return instance.post<number>({
    url: `${API_SERVICE.CMDB}/plugin/bindings/save`,
    data
  })
}

/** 切换插件绑定启停状态 */
export function switchPluginBindingStatusApi(uid: string) {
  return instance.patch<Plugin.SwitchPluginBindingStatusResponse>({
    url: `${API_SERVICE.CMDB}/plugin/binding/switch/${uid}`
  })
}

/** 删除插件绑定 */
export function deletePluginBindingApi(uid: string) {
  return instance.delete<number>({
    url: `${API_SERVICE.CMDB}/plugin/binding/delete/${uid}`
  })
}

/** 批量查询资源可用插件动作 */
export function listResourcePluginActionsBatchApi(data: Plugin.ListResourcePluginActionsBatchRequest) {
  return instance.post<Plugin.ResourceActions[]>({
    url: `${API_SERVICE.CMDB}/plugin/resource/actions/batch`,
    data
  })
}

/** 解析插件动作 */
export function resolvePluginActionApi(data: Plugin.ResolveRequest) {
  return instance.post<Plugin.ResolveResult>({
    url: `${API_SERVICE.CMDB}/plugin/action/resolve`,
    data
  })
}

/** 查询插件运行时视图 */
export function getPluginRuntimeViewApi(params: Plugin.GetPluginRuntimeViewRequest) {
  return instance.get<Plugin.PluginRuntimeView>({
    url: `${API_SERVICE.CMDB}/plugin/runtime/view`,
    params
  })
}
