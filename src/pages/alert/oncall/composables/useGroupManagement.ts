import { ref, computed } from "vue"
import type { Ref } from "vue"
import { ElMessage } from "element-plus"
import type { OnCallGroup } from "@/api/alert/oncall/types/oncall"
import type { User as IIamUser } from "@/api/iam/user/type"

export function useGroupManagement(rotaGroups: Ref<OnCallGroup[]>, renderKey: Ref<number>) {
  const currentAddingGroupId = ref<number | null>(null)

  // 计算当前组已存在的用户列表
  const existingUsers = computed(() => {
    if (!currentAddingGroupId.value) return []
    const currentGroup = rotaGroups.value.find((g: OnCallGroup) => g.id === currentAddingGroupId.value)
    return currentGroup ? currentGroup.members : []
  })

  // 创建新组
  const createNewGroup = (): OnCallGroup => {
    const newGroupName = `${String.fromCharCode(65 + rotaGroups.value.length)}`
    return {
      id: Date.now(),
      name: newGroupName,
      members: []
    }
  }

  // 添加新组
  const addNewGroup = () => {
    try {
      const newGroup = createNewGroup()
      // 确保触发响应式更新
      rotaGroups.value = [...rotaGroups.value, newGroup]
      renderKey.value++
    } catch (error) {
      ElMessage.error("添加组失败，请重试")
    }
  }

  // 删除组
  const removeGroup = (groupId: number) => {
    // 先过滤掉要删除的组
    const filteredGroups = rotaGroups.value.filter((g: OnCallGroup) => g.id !== groupId)

    // 重新命名剩余组
    const renamedGroups = filteredGroups.map((group: OnCallGroup, index: number) => ({
      ...group,
      name: `${String.fromCharCode(65 + index)}`
    }))

    rotaGroups.value = renamedGroups
    renderKey.value++
  }

  // 添加用户到组
  const addUserToGroup = (groupId: number, user: IIamUser) => {
    const groupIndex = rotaGroups.value.findIndex((g: OnCallGroup) => g.id === groupId)
    if (groupIndex === -1) return false

    const group = rotaGroups.value[groupIndex]

    // 检查组内是否已存在该用户
    if (group.members.includes(user.username)) {
      ElMessage.warning("该用户已在此组中")
      return false
    }

    // 添加用户
    const newMembers = [...group.members, user.username]
    const newGroups = rotaGroups.value.map((g: OnCallGroup, index: number) => {
      if (index === groupIndex) {
        return { ...g, members: newMembers }
      }
      return { ...g }
    })

    rotaGroups.value = newGroups
    renderKey.value++
    return true
  }

  // 从组中移除用户
  const removeUserFromGroup = (groupId: number, memberIndex: number) => {
    const groupIndex = rotaGroups.value.findIndex((g: OnCallGroup) => g.id === groupId)
    if (groupIndex === -1) return

    const group = rotaGroups.value[groupIndex]
    const newMembers = group.members.filter((_: string, index: number) => index !== memberIndex)

    const newGroups = rotaGroups.value.map((g: OnCallGroup, index: number) => {
      if (index === groupIndex) {
        return { ...g, members: newMembers }
      }
      return { ...g }
    })

    rotaGroups.value = newGroups
    renderKey.value++
  }

  // 更新组成员 - 简化版本
  const updateGroupMembers = (groupId: number, newMembers: string[]) => {
    const groupIndex = rotaGroups.value.findIndex((g: OnCallGroup) => g.id === groupId)
    if (groupIndex === -1) {
      return
    }

    // 直接更新数据
    const newGroups = [...rotaGroups.value]
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      members: [...newMembers]
    }

    rotaGroups.value = newGroups
  }

  return {
    currentAddingGroupId,
    existingUsers,
    addNewGroup,
    removeGroup,
    addUserToGroup,
    removeUserFromGroup,
    updateGroupMembers
  }
}
