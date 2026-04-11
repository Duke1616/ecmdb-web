import type { ActionDetail } from "@/api/iam/permission/type"

/**
 * UI 专用：增强型的权限清单模型
 * 解决了后端原始结构中 actions 只是字符串数组，没有翻译信息的问题
 */

export interface ManifestAction extends ActionDetail {}

export interface ManifestGroup {
  name: string
  actions: ManifestAction[]
}

export interface ManifestService {
  code: string
  name: string
  entries: ManifestGroup[]
}
