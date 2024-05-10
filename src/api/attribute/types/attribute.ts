export interface CreateAttributeRequestData {
  model_uid: string
  field_uid: string
  field_name: string
  field_type: string
  required: boolean
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

export interface AttributeGroup {
  group_name: string
  group_id: number
  expanded: boolean
  attributes: Attribute[]
}

export interface Attribute {
  id: number
  model_uid: string
  field_uid: string
  field_name: string
  field_type: string
  required: boolean
  display?: boolean
  index?: number
}

export type listAttributesResponseData = ApiResponseData<{
  ags: AttributeGroup[]
}>
