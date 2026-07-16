import type { Ref } from "vue"
import { ElMessage } from "element-plus"
import { findIndex } from "lodash-es"
import { sortCodebookApi } from "@/api/task/codebook"
import type { WorkspaceNode } from "@/api/task/codebook/types/codebook"
import { usePermission } from "@/common/composables/usePermission"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { getTreeNodeData, normalizeDropType, type TreeDropType, type TreeNodeLike } from "./useCodebookTree"

type TreeDragOptions = {
  keyword: Ref<string>
  treeLoading: Ref<boolean>
  treeRawData: Ref<WorkspaceNode[]>
  refreshAll: () => Promise<void>
}

export function useCodebookTreeDrag(options: TreeDragOptions) {
  const { hasPermission } = usePermission()

  function allowTreeDrag(node: TreeNodeLike) {
    const data = getTreeNodeData(node)
    return Boolean(
      hasPermission(TASK_CAPABILITIES.Codebook.Sort) &&
        data.layer === "PROJECT" &&
        !data.readonly &&
        data.source_id &&
        !options.keyword.value.trim() &&
        !options.treeLoading.value
    )
  }

  function allowTreeDrop(draggingNode: TreeNodeLike, dropNode: TreeNodeLike, type: TreeDropType) {
    if (!allowTreeDrag(draggingNode) || options.keyword.value.trim()) return false
    const dragging = getTreeNodeData(draggingNode)
    const target = getTreeNodeData(dropNode)
    if (target.layer !== "PROJECT" || target.readonly || dragging.source_id === target.source_id) return false

    const dropType = normalizeDropType(type)
    if (dropType === "inner") {
      return target.kind === "DIRECTORY" && !isAncestor(dragging.source_id, target.source_id)
    }
    return Boolean(
      target.source_id && target.parent_id !== dragging.source_id && !isAncestor(dragging.source_id, target.parent_id)
    )
  }

  async function handleTreeNodeDrop(draggingNode: TreeNodeLike, dropNode: TreeNodeLike, dropType: TreeDropType) {
    const dragging = getTreeNodeData(draggingNode)
    const target = getTreeNodeData(dropNode)
    if (!allowTreeDrop(draggingNode, dropNode, dropType)) {
      ElMessage.warning("只允许调整当前项目源码的目录和排序")
      await options.refreshAll()
      return
    }

    options.treeLoading.value = true
    try {
      await sortCodebookApi({
        id: dragging.source_id,
        target_parent_id: normalizeDropType(dropType) === "inner" ? target.source_id : target.parent_id,
        target_position: resolveDropPosition(dragging.source_id, dropNode, dropType)
      })
      ElMessage.success("排序成功")
    } catch {
      ElMessage.error("排序失败")
    } finally {
      await options.refreshAll()
      options.treeLoading.value = false
    }
  }

  function isAncestor(ancestorID: number, targetID: number) {
    let current = options.treeRawData.value.find((item) => item.layer === "PROJECT" && item.source_id === targetID)
    while (current?.parent_id) {
      if (current.parent_id === ancestorID) return true
      current = options.treeRawData.value.find(
        (item) => item.layer === "PROJECT" && item.source_id === current?.parent_id
      )
    }
    return false
  }

  function resolveDropPosition(sourceID: number, dropNode: TreeNodeLike, dropType: TreeDropType) {
    const parentNode = normalizeDropType(dropType) === "inner" ? dropNode : dropNode.parent
    const siblings = parentNode?.childNodes || []
    const currentIndex = findIndex(siblings, (node) => getTreeNodeData(node).source_id === sourceID)
    return currentIndex >= 0 ? currentIndex : siblings.length
  }

  return { allowTreeDrag, allowTreeDrop, handleTreeNodeDrop }
}
