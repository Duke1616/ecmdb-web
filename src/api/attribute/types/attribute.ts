export interface AttributeGroup {
  group_name: string
  group_id: number
  expanded: boolean
  attributes: Attribute[]
}

export interface Attribute {
  id: number
  model_uid: string
  name: string
  field_name: string
  field_type: string
  required: boolean

  showDetail: boolean
}

export type listAttributesResponseData = ApiResponseData<{
  ags: AttributeGroup[]
}>
