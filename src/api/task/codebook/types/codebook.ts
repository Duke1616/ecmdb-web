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
}

export interface codebooks {
  codebooks: codebook[]
  total: number
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
}

export interface UpdateProjectReq {
  id: number
  name: string
  desc: string
  sort_no?: number
}

export interface CodebookProject {
  id: number
  tenant_id: number
  scope: string
  name: string
  desc: string
  sort_no: number
  status: string
  ctime: number
  utime: number
}

export interface projects {
  projects: CodebookProject[]
  total: number
}
