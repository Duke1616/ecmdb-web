import type { CodebookScope } from "@/api/task/codebook/types/codebook"

/** 制品所属目标。SYSTEM 制品的项目 ID 固定为 0。 */
export interface ArtifactTarget {
  scope: CodebookScope
  project_id: number
}

/** 发布项目当前代码树。 */
export interface PublishArtifactReq extends ArtifactTarget {
  message: string
}

/** 查询制品发布记录。 */
export interface ListArtifactsReq extends ArtifactTarget {
  offset: number
  limit: number
}

/** 激活指定制品版本。 */
export interface ActivateArtifactReq extends ArtifactTarget {
  id: number
}

/** 不可变的制品发布记录。 */
export interface ArtifactRelease {
  id: number
  tenant_id: number
  scope: CodebookScope
  project_id: number
  source_revision: number
  digest: string
  blob_checksum: string
  size: number
  format: string
  format_version: number
  message: string
  author_user_id: number
  active: boolean
  ctime: number
}

/** 当前目标的制品配置及发布状态。 */
export interface ArtifactStatus extends ArtifactTarget {
  source_revision: number
  pending_changes: boolean
  active: ArtifactRelease | null
}

/** 制品发布记录分页结果。 */
export interface ArtifactReleaseList {
  total: number
  releases: ArtifactRelease[]
}
