import type { Attribute, AttributeGroup, listAttributesResponseData } from "@/api/attribute/types/attribute"

const DEFAULT_SORT = 10000

const sortValue = (item: { sort_key?: number; index?: number }) => item.sort_key ?? item.index ?? DEFAULT_SORT
const displaySortValue = (item: { index?: number }) => item.index ?? DEFAULT_SORT

export type AttributeGroupView = AttributeGroup & {
  expanded: boolean
  total: number
  attributes: Attribute[]
}

export type AttributeListView = {
  model: listAttributesResponseData["model"]
  groups: AttributeGroupView[]
  fields: Attribute[]
  displayFields: Attribute[]
}

const sortAttributes = (fields: Attribute[] = []) => [...fields].sort((a, b) => sortValue(a) - sortValue(b))

const sortGroups = (groups: AttributeGroup[] = []) => [...groups].sort((a, b) => sortValue(a) - sortValue(b))

const getDisplayFields = (fields: Attribute[]) =>
  fields.filter((field) => field.display === true).sort((a, b) => displaySortValue(a) - displaySortValue(b))

const getGroupAttributes = (
  group: AttributeGroup,
  fieldByUid: Map<string, Attribute>,
  fieldsByGroupId: Map<number, Attribute[]>
) => {
  if (!group.field_uids?.length) return fieldsByGroupId.get(group.group_id) || []

  return group.field_uids.map((uid) => fieldByUid.get(uid)).filter((field): field is Attribute => Boolean(field))
}

export const createAttributeGroups = (
  groups: AttributeGroup[] = [],
  fields: Attribute[] = []
): AttributeGroupView[] => {
  const fieldByUid = new Map(fields.map((field) => [field.field_uid, field]))
  const fieldsByGroupId = new Map<number, Attribute[]>()

  fields.forEach((field) => {
    const groupFields = fieldsByGroupId.get(field.group_id) || []
    groupFields.push(field)
    fieldsByGroupId.set(field.group_id, groupFields)
  })

  return sortGroups(groups).map((group) => {
    const attributes = getGroupAttributes(group, fieldByUid, fieldsByGroupId)

    return {
      ...group,
      expanded: true,
      total: attributes.length,
      attributes
    }
  })
}

export const createAttributeListView = (data: listAttributesResponseData): AttributeListView => {
  const fields = sortAttributes(data.fields || [])

  return {
    model: data.model,
    groups: createAttributeGroups(data.groups || [], fields),
    fields,
    displayFields: getDisplayFields(fields)
  }
}
