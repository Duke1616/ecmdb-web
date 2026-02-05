import { ref } from "vue"
import { ElMessage } from "element-plus"
import { sortMenuApi } from "@/api/menu"
import type { menu } from "@/api/menu/types/menu"
import type { Ref } from "vue"

export function useMenuSort(menuTreeData: Ref<menu[]>, refreshCallback: () => void) {
  const isDragMode = ref(false)
  const dragLoading = ref(false)

  const toggleSortMode = () => {
    isDragMode.value = !isDragMode.value
    if (!isDragMode.value) {
      refreshCallback()
    } else {
      ElMessage.info("已进入排序模式，拖拽菜单项即可调整顺序")
    }
  }

  const handleDragEnd = async (dragNode: any, dropNode: any, dropType: string) => {
    if (!dragNode || !dropNode) return

    try {
      dragLoading.value = true

      const id = dragNode.data.id
      let targetPid = 0
      let siblings: any[] = []

      // 根据拖拽类型确定新的父节点和兄弟列表
      if (dropType === "inner") {
        targetPid = dropNode.data.id
        siblings = dropNode.data.children || []
      } else {
        if (dropNode.parent && dropNode.parent.level > 0) {
          targetPid = dropNode.parent.data.id
          siblings = dropNode.parent.data.children || []
        } else {
          targetPid = 0
          siblings = menuTreeData.value
        }
      }

      // 查找当前节点在新的兄弟列表中的位置
      // 使用 == 宽松匹配，因为 id 可能是数字或字符串
      let targetPosition = siblings.findIndex((item: any) => item.id == id)

      // 如果没找到，尝试根据 dropNode 推断位置 (作为兜底)
      if (targetPosition === -1) {
        console.warn("未能在目标列表中找到节点，尝试推断位置", { id, targetPid })
        const dropIndex = siblings.findIndex((item: any) => item.id == dropNode.data.id)

        if (dropIndex !== -1) {
          if (dropType === "before") {
            targetPosition = dropIndex
          } else if (dropType === "after") {
            targetPosition = dropIndex + 1
          } else if (dropType === "inner") {
            // 如果是 inner 且没找到，可能是数据未同步，假设在最后
            targetPosition = siblings.length
          }
        }
      }

      if (targetPosition === -1) {
        console.error("无法找到目标位置", { id, targetPid, siblingsLen: siblings.length })
        throw new Error("定位失败")
      }

      await sortMenuApi({
        id,
        target_pid: targetPid,
        target_position: targetPosition
      })

      ElMessage.success("排序已更新")
    } catch (error) {
      console.error("排序失败", error)
      ElMessage.error("排序更新失败，请重试")
      refreshCallback()
    } finally {
      dragLoading.value = false
    }
  }

  return {
    isDragMode,
    dragLoading,
    toggleSortMode,
    handleDragEnd
  }
}
