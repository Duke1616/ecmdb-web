import instance, { API_SERVICE } from "@@/utils/service"
import type { ListResourcesReq, ListResourcesResp, Resource } from "./type"

export const listResourcesApi = (params: ListResourcesReq = {}) => {
  return instance.get<ListResourcesResp>({
    url: `${API_SERVICE.TASK}/resource/list`,
    params
  })
}

export const listAllResourcesApi = async (params: ListResourcesReq = {}) => {
  const resources: Resource[] = []
  const limit = params.limit ?? 100
  let offset = params.offset ?? 0
  let total = Number.POSITIVE_INFINITY

  while (offset < total) {
    const { data } = await listResourcesApi({
      ...params,
      offset,
      limit
    })
    const list = data.resources || []
    resources.push(...list)
    offset += list.length
    total = data.total || 0
    if (list.length === 0) break
  }

  return resources
}
