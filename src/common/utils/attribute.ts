import { reactive } from "vue"
import type { Attribute, AttributeGroup, listAttributesResponseData } from "@/api/attribute/types/attribute"

const DEFAULT_SORT = 10000

const sortValue = (item: { sort_key?: number; index?: number }) => item.sort_key ?? item.index ?? DEFAULT_SORT
const displaySortValue = (item: { index?: number }) => item.index ?? DEFAULT_SORT

export type AttributeGroupView = AttributeGroup & {
  expanded: boolean
  total: number
  attributes: Attribute[]
}

export type AttributeSchema = {
  model: listAttributesResponseData["model"]
  groups: AttributeGroupView[]
  fields: Attribute[]
  displayFields: Attribute[]
  expandedGroupIds: Set<number>
  fieldsByGroupId: Map<number, Attribute[]>
  fieldByUid: Map<string, Attribute>
  getGroupFields: (group: AttributeGroup) => Attribute[]
  getGroupFieldCount: (group: AttributeGroup) => number
  isExpanded: (group: AttributeGroup) => boolean
  setExpanded: (group: AttributeGroup, expanded: boolean) => void
  toggleExpanded: (group: AttributeGroup) => void
}

export const createAttributeSchema = (data: listAttributesResponseData): AttributeSchema => {
  const fields = [...(data.fields || [])].sort((a, b) => sortValue(a) - sortValue(b))
  const rawGroups = [...(data.groups || [])].sort((a, b) => sortValue(a) - sortValue(b))
  const fieldByUid = new Map(fields.map((field) => [field.field_uid, field]))
  const fieldsByGroupId = new Map<number, Attribute[]>()

  fields.forEach((field) => {
    const groupFields = fieldsByGroupId.get(field.group_id) || []
    groupFields.push(field)
    fieldsByGroupId.set(field.group_id, groupFields)
  })

  const expandedGroupIds = reactive(new Set(rawGroups.map((group) => group.group_id))) as Set<number>

  const getGroupFields = (group: AttributeGroup) => {
    if (group.field_uids?.length) {
      return group.field_uids.map((uid) => fieldByUid.get(uid)).filter((field): field is Attribute => Boolean(field))
    }

    return fieldsByGroupId.get(group.group_id) || []
  }

  const groups = rawGroups.map((group) => {
    const attributes = getGroupFields(group)

    return {
      ...group,
      expanded: true,
      total: attributes.length,
      attributes
    }
  })

  return {
    model: data.model,
    groups,
    fields,
    displayFields: fields
      .filter((field) => field.display === true)
      .sort((a, b) => displaySortValue(a) - displaySortValue(b)),
    expandedGroupIds,
    fieldsByGroupId,
    fieldByUid,
    getGroupFields,
    getGroupFieldCount: (group) => getGroupFields(group).length,
    isExpanded: (group) => expandedGroupIds.has(group.group_id),
    setExpanded: (group, expanded) => {
      if (expanded) {
        expandedGroupIds.add(group.group_id)
      } else {
        expandedGroupIds.delete(group.group_id)
      }
    },
    toggleExpanded: (group) => {
      if (expandedGroupIds.has(group.group_id)) {
        expandedGroupIds.delete(group.group_id)
      } else {
        expandedGroupIds.add(group.group_id)
      }
    }
  }
}
