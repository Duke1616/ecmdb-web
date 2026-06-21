import type { codebook } from "@/api/task/codebook/types/codebook"
import { filter, keyBy, some, sortBy } from "lodash-es"
import { getFileExt, inferLanguage } from "./useCodebookFile"

export interface CodebookTreeNode extends codebook {
  treeKey: string
  children?: CodebookTreeNode[]
}

export type TreeDropType = "before" | "after" | "inner" | "prev" | "next"

export type TreeNodeLike = {
  data: unknown
  parent?: TreeNodeLike | null
  childNodes?: TreeNodeLike[]
}

export const treeProps = { label: "name", children: "children" }

export function createRootDirectory(projectID: number): codebook {
  return {
    id: 0,
    tenant_id: 0,
    project_id: projectID,
    scope: "TENANT",
    parent_id: 0,
    path_ids: "/",
    depth: 0,
    name: "全部资源",
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

export function buildTree(items: codebook[]): CodebookTreeNode[] {
  const nodes = items.map<CodebookTreeNode>((item) => ({
    ...item,
    treeKey: `${item.kind.toLowerCase()}-${item.id}`,
    children: []
  }))
  const nodeMap = keyBy(nodes, "id")
  const roots: CodebookTreeNode[] = []

  nodes.forEach((node) => {
    const parent = node.parent_id ? nodeMap[node.parent_id] : null
    if (parent) {
      parent.children?.push(node)
    } else {
      roots.push(node)
    }
  })

  nodes.forEach((node) => {
    node.children = sortCodebookNodes(node.children || [])
  })

  return sortCodebookNodes(roots)
}

export function filterCodebookTreeItems(items: codebook[], keyword: string) {
  const query = keyword.trim().toLowerCase()
  if (!query) return items

  const matched = new Set<number>()
  const byID = keyBy(items, "id")
  items.forEach((item) => {
    const hit = some([item.name, item.owner, inferLanguage(item.name), getFileExt(item.name)], (value) =>
      String(value || "")
        .toLowerCase()
        .includes(query)
    )
    if (!hit) return

    matched.add(item.id)
    let parentID = item.parent_id
    while (parentID) {
      const parent = byID[parentID]
      if (!parent) break
      matched.add(parent.id)
      parentID = parent.parent_id
    }
  })

  return filter(items, (item) => matched.has(item.id))
}

export function sortCodebookNodes<T extends codebook>(items: T[]) {
  return sortBy(items, [(item) => item.sort_no, (item) => item.id])
}

export function isSystemCodebook(item?: Pick<codebook, "scope"> | null) {
  return item?.scope === "SYSTEM"
}

export function getTreeNodeData(node: TreeNodeLike) {
  return node.data as CodebookTreeNode
}

export function normalizeDropType(dropType: TreeDropType): "before" | "after" | "inner" {
  if (dropType === "prev") return "before"
  if (dropType === "next") return "after"
  return dropType
}
