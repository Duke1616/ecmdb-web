import { ref, nextTick } from "vue"
import { ElMessage } from "element-plus"

export function useDragAndDrop() {
  const renderKey = ref(0)

  // 拖拽检测状态
  const dragCheckState = ref({
    lastCheckTime: 0,
    lastDraggedUser: "",
    lastTargetGroup: null as number | null,
    hasShownWarning: false
  })

  // 重置拖拽检测状态
  const resetDragState = () => {
    dragCheckState.value = {
      lastCheckTime: 0,
      lastDraggedUser: "",
      lastTargetGroup: null,
      hasShownWarning: false
    }
  }

  // 从文本中提取用户名
  const extractUsername = (text: string): string => {
    const usernameMatch = text.match(/\[([^\]]+)\]/)
    return usernameMatch ? usernameMatch[1] : text.split(" ")[0]
  }

  // 检查组内重复用户
  const checkGroupDuplicate = (groupMembers: string[], username: string): boolean => {
    return groupMembers.includes(username)
  }

  // 移除组内重复用户
  const removeGroupDuplicates = (members: string[]): string[] => {
    const seen = new Set<string>()
    return members.filter((member) => {
      if (seen.has(member)) {
        return false
      }
      seen.add(member)
      return true
    })
  }

  // 处理拖拽开始
  const onDragStart = () => {
    resetDragState()
    // 添加拖拽类，禁用文字选择 - 使用更安全的方式
    try {
      const allMembersLists = document.querySelectorAll(".members-list")
      allMembersLists.forEach((list) => {
        if (list && list.classList) {
          list.classList.add("dragging")
        }
      })
    } catch (error) {
      console.warn("添加拖拽类失败:", error)
    }
  }

  // 处理拖拽移动（检查重复）
  const onDragMove = (evt: any, rotaGroups: any[]) => {
    const now = Date.now()

    const draggedElement = evt.dragged
    const draggedText = draggedElement.textContent || draggedElement.innerText
    const draggedUsername = extractUsername(draggedText)

    const targetContainer = evt.to
    const targetGroupElement = targetContainer.closest(".group-container")

    if (!targetGroupElement) return true

    const targetGroupId = parseInt(targetGroupElement.dataset.groupId)
    const targetGroup = rotaGroups.find((g) => g.id === targetGroupId)

    if (!targetGroup) return true

    // 防抖检查
    const isSameCheck =
      dragCheckState.value.lastDraggedUser === draggedUsername && dragCheckState.value.lastTargetGroup === targetGroupId

    if (isSameCheck && now - dragCheckState.value.lastCheckTime < 500) {
      return !dragCheckState.value.hasShownWarning
    }

    // 更新检测状态
    dragCheckState.value.lastCheckTime = now
    dragCheckState.value.lastDraggedUser = draggedUsername
    dragCheckState.value.lastTargetGroup = targetGroupId

    // 检查重复
    if (checkGroupDuplicate(targetGroup.members, draggedUsername)) {
      if (!dragCheckState.value.hasShownWarning) {
        ElMessage.warning("该用户已在此组中，不能重复添加")
        dragCheckState.value.hasShownWarning = true
      }
      return false
    } else {
      dragCheckState.value.hasShownWarning = false
    }

    return true
  }

  // 处理拖拽变化（清理重复）
  const onDragChange = async (evt: any, rotaGroups: any[], updateGroups: (groups: any[]) => void) => {
    if (!evt.added) return

    const addedElement = evt.added.element
    const targetGroupIndex = rotaGroups.findIndex((group) => group.members.includes(addedElement))

    if (targetGroupIndex === -1) return

    const targetGroup = rotaGroups[targetGroupIndex]
    const userCount = targetGroup.members.filter((member: string) => member === addedElement).length

    if (userCount > 1) {
      const newGroups = rotaGroups.map((group, index) => {
        if (index === targetGroupIndex) {
          return {
            ...group,
            members: removeGroupDuplicates(group.members)
          }
        }
        return group
      })

      updateGroups(newGroups)
      ElMessage.warning("该用户已在此组中，不能重复添加")
    }
  }

  // 处理拖拽结束
  const onDragEnd = async (rotaGroups: any[], updateGroups: (groups: any[]) => void) => {
    // 移除拖拽类 - 使用更安全的方式
    try {
      const allMembersLists = document.querySelectorAll(".members-list")
      allMembersLists.forEach((list) => {
        if (list && list.classList) {
          list.classList.remove("dragging")
        }
      })
    } catch (error) {
      console.warn("移除拖拽类失败:", error)
    }

    // 重新命名组
    const newGroups = rotaGroups.map((group, index) => ({
      ...group,
      name: `${String.fromCharCode(65 + index)}`,
      members: [...group.members]
    }))

    updateGroups(newGroups)
    await nextTick()
  }

  // 强制更新
  const forceUpdate = () => {
    renderKey.value++
  }

  return {
    renderKey,
    onDragStart,
    onDragMove,
    onDragChange,
    onDragEnd,
    forceUpdate,
    checkGroupDuplicate,
    removeGroupDuplicates
  }
}
