export interface createOrUpdateAttributeReq {
  id?: number
  group_id: number
  model_uid: string
  field_uid: string
  field_name: string
  field_type: string
  secure: boolean
  required: boolean
  link: boolean
  option: any
}

export interface CustomAttributeFieldColumnsReq {
  model_uid: string
  custom_field_name: string[]
}

export interface CustomField {
  name: string
  index: number
  id: number
}

export interface CreateAttributeGroupReq {
  group_name: string
  model_uid: string
}

export interface AttributeGroup {
  group_name: string
  group_id: number
  index: number
  model_uid: string
  sort_key: number
  field_uids?: string[]
}

export interface Attribute {
  id: number
  group_id: number
  model_uid: string
  field_uid: string
  field_name: string
  field_type: string
  required: boolean
  display?: boolean
  index?: number
  secure: boolean
  link: boolean
  option: any
  sort_key?: number
  builtin?: boolean
}

export type listAttributeFieldData = {
  total: number
  attribute_fields: Attribute[]
}

export type listAttributesResponseData = {
  model: {
    model_uid: string
    name: string
  }
  groups: AttributeGroup[]
  fields: Attribute[]
}

export interface DeleteAttributeGroupReq {
  id: number
}

export interface RenameAttributeGroupReq {
  id: number
  name: string
}

export interface SortAttributeReq {
  id: number
  target_group_id: number
  target_position: number
}

export interface SortAttributeGroupReq {
  id: number
  target_position: number
}
