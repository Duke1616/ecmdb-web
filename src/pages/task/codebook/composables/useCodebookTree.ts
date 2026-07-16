import type { codebook, CodebookScope, WorkspaceNode } from "@/api/task/codebook/types/codebook"
import { some } from "lodash-es"
import { getFileExt, inferLanguage } from "./useCodebookFile"

export interface CodebookTreeNode extends WorkspaceNode {
  children: CodebookTreeNode[]
}

export type TreeDropType = "before" | "after" | "inner" | "prev" | "next"

export type TreeNodeLike = {
  data: unknown
  parent?: TreeNodeLike | null
  childNodes?: TreeNodeLike[]
}

export const treeProps = { label: "name", children: "children" }

export function createRootDirectory(projectID: number, scope: CodebookScope = "TENANT"): codebook {
  return {
    id: 0,
    tenant_id: 0,
    project_id: projectID,
    scope,
    parent_id: 0,
    path_ids: "/",
    depth: 0,
    name: "project",
    owner: "",
    kind: "DIRECTORY",
    sort_no: 0,
    code: "",
    secret: "",
    current_version_id: 0,
    ctime: 0,
    utime: 0
  }
}

export function filterWorkspaceTree(nodes: CodebookTreeNode[], keyword: string): CodebookTreeNode[] {
  const query = keyword.trim().toLowerCase()
  if (!query) return nodes

  return nodes.flatMap((node) => {
    const children = filterWorkspaceTree(node.children || [], query)
    const matched = some(
      [node.name, node.owner, node.runtime_path, inferLanguage(node.name), getFileExt(node.name)],
      (value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
    )
    return matched || children.length ? [{ ...node, children }] : []
  })
}

export function workspaceNodeToCodebook(node: WorkspaceNode, code = ""): codebook {
  return {
    id: node.source_id,
    tenant_id: 0,
    project_id: node.project_id,
    scope: node.scope,
    parent_id: node.parent_id,
    path_ids: node.runtime_path,
    depth: 0,
    name: node.name,
    owner: node.owner,
    kind: node.kind,
    sort_no: node.sort_no,
    code,
    secret: "",
    current_version_id: 0,
    ctime: 0,
    utime: 0,
    readonly: node.readonly,
    workspace_key: node.key,
    runtime_path: node.runtime_path,
    release_id: node.release_id,
    digest: node.digest,
    artifact_path: node.artifact_path,
    children: node.children.map((child) => workspaceNodeToCodebook(child))
  }
}

export function flattenWorkspaceTree(nodes: CodebookTreeNode[]): CodebookTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenWorkspaceTree(node.children || [])])
}

export function isReadonlyCodebook(item?: Pick<codebook, "scope" | "readonly"> | null) {
  return Boolean(item?.readonly || item?.scope === "SYSTEM")
}

export const isSystemCodebook = isReadonlyCodebook

export function getTreeNodeData(node: TreeNodeLike) {
  return node.data as CodebookTreeNode
}

export function normalizeDropType(dropType: TreeDropType): "before" | "after" | "inner" {
  if (dropType === "prev") return "before"
  if (dropType === "next") return "after"
  return dropType
}
