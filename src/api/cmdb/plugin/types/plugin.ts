export const PLUGIN_ACTION_PLACEMENT = {
  ResourceDetailActions: "resource.detail.actions"
} as const

export const PLUGIN_DIRECTION = {
  Source: "source",
  Target: "target"
} as const

export const PLUGIN_RELATION_TYPE = {
  Default: "default",
  Group: "group",
  Belong: "belong",
  Run: "run"
} as const

export const PLUGIN_CARDINALITY = {
  One: "one",
  Many: "many"
} as const

export const PLUGIN_UI = {
  BuiltinTerminal: "builtin:terminal",
  BuiltinSFTP: "builtin:sftp"
} as const

export const PLUGIN_MAPPING = {
  OneToOne: "one_to_one",
  OneToMany: "one_to_many",
  ManyToMany: "many_to_many"
} as const

export interface EnumOption {
  label: string
  value: string
}

export interface Filter {
  field: string
  operator: string
  value: any
}

export interface FieldMapping {
  input: string
  resource_field: string
  required?: boolean
}

export interface BindingGraphNode {
  id: string
  name: string
  kind?: string
  model_uid: string
  cardinality: string
  required: boolean
  field_mappings?: FieldMapping[]
  filters?: Filter[]
}

export interface BindingGraphEdge {
  from: string
  to: string
  relation_type?: string
  direction?: string
}

export interface BindingGraph {
  entry_node_id: string
  nodes: BindingGraphNode[]
  edges?: BindingGraphEdge[]
}

export interface ActionSpec {
  action: string
  name: string
  icon: string
  placement: string
  ui: string
  meta?: Record<string, any>
}

export interface Plugin {
  id?: number
  uid: string
  name: string
  type: string
  version: string
  actions: ActionSpec[]
  ctime?: number
  utime?: number
}

export interface Binding {
  id?: number
  uid: string
  plugin_id: string
  model_uid: string
  enabled: boolean
  graph?: BindingGraph
  ctime?: number
  utime?: number
}

export interface SchemaModelGroup {
  name: string
}

export interface SchemaAttribute {
  uid: string
  name: string
  type: string
  option?: any
  required?: boolean
  display?: boolean
  secure?: boolean
  builtin?: boolean
  index?: number
}

export interface SchemaAttributeGroup {
  name: string
  index?: number
  fields?: SchemaAttribute[]
}

export interface SchemaModel {
  uid: string
  name: string
  icon?: string
  group_name?: string
  builtin?: boolean
  attribute_groups?: SchemaAttributeGroup[]
}

export interface SchemaRelationType {
  uid: string
  name: string
  source_describe?: string
  target_describe?: string
}

export interface SchemaModelRelation {
  source_model_uid: string
  target_model_uid: string
  relation_type_uid: string
  mapping: string
}

export interface Schema {
  model_groups?: SchemaModelGroup[]
  models?: SchemaModel[]
  relation_types?: SchemaRelationType[]
  model_relations?: SchemaModelRelation[]
}

export interface Definition {
  plugin: Plugin
  schema?: Schema
  bindings: Binding[]
}

export interface SavePluginBindingsRequest {
  plugin_id: string
  bindings: Binding[]
}

export interface UpdatePluginBindingEnabledRequest {
  uid: string
  enabled: boolean
}

export interface ResourceAction {
  plugin_id: string
  action: string
  name: string
  icon: string
  placement: string
  ui: string
  meta?: Record<string, any>
}

export interface ResourceActions {
  resource_id: number
  actions: ResourceAction[]
}

export interface ResolvedResource {
  resource_id?: number
  model_uid?: string
  fields: Record<string, any>
  children?: Record<string, ResolvedInput>
}

export interface ResolvedInput {
  name: string
  cardinality: string
  resources: ResolvedResource[]
}

export interface ResolveRequest {
  plugin_id: string
  action: string
  resource_id: number
  params?: Record<string, any>
}

export interface ResolveResult {
  ui?: string
  plugin_id: string
  plugin_name: string
  action: string
  resource_id: number
  inputs: Record<string, ResolvedInput>
  params?: Record<string, any>
  meta?: Record<string, any>
}

export interface PluginBoundModel {
  uid: string
  name: string
  group_name?: string
  icon?: string
  builtin: boolean
}

export interface PluginListItem {
  id: number
  uid: string
  name: string
  type: string
  version: string
  action_count: number
  binding_count: number
  bound_models: PluginBoundModel[]
  actions: ActionSpec[]
  updated_at: number
}

export interface PluginListResponse {
  list: PluginListItem[]
  total: number
}

export interface PluginBindingDetail {
  id: number
  uid: string
  plugin_id: string
  model_uid: string
  model_name?: string
  group_name?: string
  model_icon?: string
  enabled: boolean
  graph?: BindingGraph
}

export interface PluginDetail {
  plugin: Plugin
  bindings: PluginBindingDetail[]
}

export interface PluginModelOption {
  uid: string
  name: string
  group_name?: string
  icon?: string
  builtin: boolean
}

export interface PluginManagementEnums {
  types: string[]
  placements: EnumOption[]
  uis: EnumOption[]
  directions: EnumOption[]
  relation_types: EnumOption[]
  cardinalities: EnumOption[]
  mappings: EnumOption[]
  models: PluginModelOption[]
}
