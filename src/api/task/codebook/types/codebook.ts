export type CodebookScope = "SYSTEM" | "TENANT"
export type CodebookKind = "DIRECTORY" | "FILE"

export interface createOrUpdateCodebookReq {
  id?: number
  project_id: number
  name: string
  owner: string
  code: string
  parent_id?: number
  scope?: CodebookScope
  kind?: CodebookKind
  version_no?: number
  sort_no?: number
}

export interface codebook {
  id: number
  tenant_id: number
  project_id: number
  scope: CodebookScope
  parent_id: number
  path_ids: string
  depth: number
  name: string
  owner: string
  kind: CodebookKind
  sort_no: number
  code: string
  secret: string
  current_version_id: number
  ctime: number
  utime: number
  children?: codebook[]
  readonly?: boolean
  workspace_key?: string
  runtime_path?: string
  release_id?: number
  digest?: string
  artifact_path?: string
}

export interface codebooks {
  codebooks: codebook[]
  total: number
}

export type WorkspaceLayer = "PROJECT" | "SYSTEM" | "DEPENDENCY"

export interface WorkspaceNode {
  key: string
  source_id: number
  release_id: number
  digest: string
  artifact_path: string
  name: string
  owner: string
  kind: CodebookKind
  scope: CodebookScope
  layer: WorkspaceLayer
  runtime_path: string
  readonly: boolean
  project_id: number
  parent_id: number
  sort_no: number
  namespace: string
  children: WorkspaceNode[]
}

export interface WorkspaceTreeResp {
  nodes: WorkspaceNode[]
}

export interface WorkspaceFileReq {
  project_id: number
  release_id: number
  digest: string
  artifact_path: string
}

export interface WorkspaceFileResp {
  code: string
}

export interface listCodebookReq {
  /** 跳过条数 */
  offset: number
  /** 查询条数 */
  limit: number
}

export interface childrenCodebookReq {
  project_id: number
  parent_id: number
}

export interface treeCodebookReq {
  project_id: number
  scope?: CodebookScope | ""
}

export interface sortCodebookReq {
  id: number
  target_parent_id: number
  target_position: number
}

export interface CreateVersionReq {
  node_id: number
  version_no?: number
  code: string
  message: string
}

export interface UseVersionReq {
  node_id: number
  version_id: number
}

export interface ListVersionsReq {
  node_id: number
}

export interface CodebookVersion {
  id: number
  node_id: number
  tenant_id: number
  scope: CodebookScope
  version_no: number
  code: string
  hash: string
  message: string
  author_user_id: number
  ctime: number
}

export interface codebookVersions {
  versions: CodebookVersion[]
}

export interface CreateProjectReq {
  name: string
  desc: string
  artifact_enabled: boolean
  artifact_namespace: string
}

export interface UpdateProjectReq {
  id: number
  name: string
  desc: string
  sort_no?: number
  artifact_enabled: boolean
  artifact_namespace: string
}

export interface CodebookProject {
  id: number
  tenant_id: number
  scope: CodebookScope
  name: string
  desc: string
  sort_no: number
  status: string
  artifact_enabled: boolean
  artifact_namespace: string
  source_revision: number
  ctime: number
  utime: number
}

export interface projects {
  projects: CodebookProject[]
  total: number
}
