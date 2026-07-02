import { getModelAttributesWithGroupsApi } from "@/api/cmdb/attribute"
import type { Attribute } from "@/api/cmdb/attribute/types/attribute"

const attributeCache = new Map<string, Attribute[]>()
const attributePromiseCache = new Map<string, Promise<Attribute[]>>()

export const getCachedModelAttributes = async (modelUid?: string) => {
  if (!modelUid) return []

  const cached = attributeCache.get(modelUid)
  if (cached) return cached

  const pending = attributePromiseCache.get(modelUid)
  if (pending) return pending

  const request = getModelAttributesWithGroupsApi(modelUid)
    .then(({ data }) => {
      const fields = data.fields || []
      attributeCache.set(modelUid, fields)
      return fields
    })
    .catch(() => {
      attributeCache.set(modelUid, [])
      return []
    })
    .finally(() => {
      attributePromiseCache.delete(modelUid)
    })

  attributePromiseCache.set(modelUid, request)
  return request
}

export const clearCachedModelAttributes = (modelUid?: string) => {
  if (!modelUid) {
    attributeCache.clear()
    attributePromiseCache.clear()
    return
  }

  attributeCache.delete(modelUid)
  attributePromiseCache.delete(modelUid)
}
