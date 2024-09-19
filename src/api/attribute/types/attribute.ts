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
  expanded: boolean
  index: number
  total: number
  attributes: Attribute[]
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
}

export type listAttributeFieldData = {
  total: number
  attribute_fields: Attribute[]
}

export type listAttributesResponseData = {
  attribute_groups: AttributeGroup[]
}
