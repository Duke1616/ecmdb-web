import type { Ref } from "vue"
import { ElMessage } from "element-plus"
import { filter, findIndex, keyBy } from "lodash-es"
import { sortCodebookApi } from "@/api/task/codebook"
import type { codebook } from "@/api/task/codebook/types/codebook"
import {
  getTreeNodeData,
  normalizeDropType,
  sortCodebookNodes,
  type CodebookTreeNode,
  type TreeDropType,
  type TreeNodeLike
} from "./useCodebookTree"

type TreeDragOptions = {
  keyword: Ref<string>
  treeLoading: Ref<boolean>
  treeRawData: Ref<codebook[]>
  refreshAll: () => Promise<void>
}

export function useCodebookTreeDrag(options: TreeDragOptions) {
  function allowTreeDrag(node: TreeNodeLike) {
    const data = getTreeNodeData(node)
    return Boolean(data.id && !options.keyword.value.trim() && !options.treeLoading.value)
  }

  function allowTreeDrop(draggingNode: TreeNodeLike, dropNode: TreeNodeLike, type: TreeDropType) {
    const dropType = normalizeDropType(type)
    const draggingData = getTreeNodeData(draggingNode)
    const dropData = getTreeNodeData(dropNode)
    if (!draggingData.id || draggingData.id === dropData.id || options.keyword.value.trim()) return false

    if (dropType === "inner") {
      return dropData.kind === "DIRECTORY" && !isAncestorNode(draggingData.id, dropData.id)
    }

    if (!dropData.id) return false
    const targetParentID = dropData.parent_id || 0
    return targetParentID !== draggingData.id && !isAncestorNode(draggingData.id, targetParentID)
  }

  async function handleTreeNodeDrop(draggingNode: TreeNodeLike, dropNode: TreeNodeLike, dropType: TreeDropType) {
    const draggingData = getTreeNodeData(draggingNode)
    const dropData = getTreeNodeData(dropNode)
    if (!draggingData.id) return

    options.treeLoading.value = true
    try {
      await sortCodebookApi({
        id: draggingData.id,
        target_parent_id: resolveDropParentID(dropData, dropType),
        target_position: resolveDropPosition(draggingData, dropNode, dropType)
      })
      ElMessage.success("排序成功")
    } catch {
      ElMessage.error("排序失败")
    } finally {
      await options.refreshAll()
      options.treeLoading.value = false
    }
  }

  function isAncestorNode(ancestorID: number, targetID: number) {
    if (!ancestorID || !targetID) return false
    const byID = keyBy(options.treeRawData.value, "id")
    let current = byID[targetID]
    while (current?.parent_id) {
      if (current.parent_id === ancestorID) return true
      current = byID[current.parent_id]
    }
    return false
  }

  function resolveDropParentID(dropData: CodebookTreeNode, dropType: TreeDropType) {
    return normalizeDropType(dropType) === "inner" ? dropData.id : dropData.parent_id || 0
  }

  function resolveDropPosition(draggingData: CodebookTreeNode, dropNode: TreeNodeLike, dropType: TreeDropType) {
    const normalizedDropType = normalizeDropType(dropType)
    const parentNode = normalizedDropType === "inner" ? dropNode : dropNode.parent
    const siblingNodes = parentNode?.childNodes || []
    const currentIndex = findIndex(siblingNodes, (node) => getTreeNodeData(node).id === draggingData.id)
    if (currentIndex >= 0) return currentIndex

    const dropData = getTreeNodeData(dropNode)
    const targetParentID = resolveDropParentID(dropData, normalizedDropType)
    const siblings = sortCodebookNodes(
      filter(options.treeRawData.value, (item) => (item.parent_id || 0) === targetParentID)
    )

    if (normalizedDropType === "inner") return siblings.length
    const targetIndex = findIndex(siblings, { id: dropData.id })
    if (targetIndex < 0) return siblings.length
    return normalizedDropType === "before" ? targetIndex : targetIndex + 1
  }

  return {
    allowTreeDrag,
    allowTreeDrop,
    handleTreeNodeDrop
  }
}
