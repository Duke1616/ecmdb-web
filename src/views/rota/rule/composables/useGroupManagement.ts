import { ref, computed } from "vue"
import { ElMessage } from "element-plus"
import { rotaGroup } from "@/api/rota/types/rota"
import { user as userInfo } from "@/api/user/types/user"

export function useGroupManagement(rotaGroups: any, renderKey: any) {
  const currentAddingGroupId = ref<number | null>(null)

  // 计算当前组已存在的用户列表
  const existingUsers = computed(() => {
    if (!currentAddingGroupId.value) return []
    const currentGroup = rotaGroups.value.find((g: rotaGroup) => g.id === currentAddingGroupId.value)
    return currentGroup ? currentGroup.members : []
  })

  // 创建新组
  const createNewGroup = (): rotaGroup => {
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
      console.log("开始添加新组，当前组数:", rotaGroups.value.length)
      const newGroup = createNewGroup()
      console.log("创建新组:", newGroup)

      rotaGroups.value = [...rotaGroups.value, newGroup]
      console.log("添加后组数:", rotaGroups.value.length)

      renderKey.value++
      console.log("添加新组完成")
    } catch (error) {
      console.error("添加新组时出错:", error)
      ElMessage.error("添加组失败，请重试")
    }
  }

  // 删除组
  const removeGroup = (groupId: number) => {
    // 先过滤掉要删除的组
    const filteredGroups = rotaGroups.value.filter((g: rotaGroup) => g.id !== groupId)

    // 重新命名剩余组
    const renamedGroups = filteredGroups.map((group: rotaGroup, index: number) => ({
      ...group,
      name: `${String.fromCharCode(65 + index)}`
    }))

    rotaGroups.value = renamedGroups
    renderKey.value++
  }

  // 添加用户到组
  const addUserToGroup = (groupId: number, user: userInfo) => {
    const groupIndex = rotaGroups.value.findIndex((g: rotaGroup) => g.id === groupId)
    if (groupIndex === -1) return false

    const group = rotaGroups.value[groupIndex]

    // 检查组内是否已存在该用户
    if (group.members.includes(user.username)) {
      ElMessage.warning("该用户已在此组中")
      return false
    }

    // 添加用户
    const newMembers = [...group.members, user.username]
    const newGroups = rotaGroups.value.map((g: rotaGroup, index: number) => {
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
    const groupIndex = rotaGroups.value.findIndex((g: rotaGroup) => g.id === groupId)
    if (groupIndex === -1) return

    const group = rotaGroups.value[groupIndex]
    const newMembers = group.members.filter((_: string, index: number) => index !== memberIndex)

    const newGroups = rotaGroups.value.map((g: rotaGroup, index: number) => {
      if (index === groupIndex) {
        return { ...g, members: newMembers }
      }
      return { ...g }
    })

    rotaGroups.value = newGroups
    renderKey.value++
  }

  // 更新组成员
  const updateGroupMembers = (groupId: number, newMembers: string[]) => {
    const groupIndex = rotaGroups.value.findIndex((g: rotaGroup) => g.id === groupId)
    if (groupIndex === -1) return

    const newGroups = rotaGroups.value.map((group: rotaGroup, index: number) => {
      if (index === groupIndex) {
        return { ...group, members: [...newMembers] }
      }
      return { ...group }
    })

    rotaGroups.value = newGroups
    renderKey.value++
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
