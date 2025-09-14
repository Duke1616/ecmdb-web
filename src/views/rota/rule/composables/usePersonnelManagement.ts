import { ref } from "vue"
import { user as userInfo } from "@/api/user/types/user"
import { rotaGroup } from "@/api/rota/types/rota"
import { useUserToolsStore } from "@/pinia/stores/user-tools"

export function usePersonnelManagement() {
  const userToolsStore = useUserToolsStore()
  const members = ref<string[]>([])

  // 添加人员到轮换组
  const addRotaGroup = (user: userInfo, rotaGroups: rotaGroup[]) => {
    // 检查用户是否已经存在于任何组中
    const userExists = rotaGroups.some((group) => group.members.includes(user.username))

    if (userExists) {
      console.log("用户已存在，跳过添加")
      return
    }

    const newGroupName = `${String.fromCharCode(65 + rotaGroups.length)}`
    const newGroup = {
      id: Date.now(),
      name: newGroupName,
      members: [user.username]
    }

    // 缓存用户信息
    userToolsStore.setToMap(user.username, user.display_name + " [" + user.username + "] ")
    rotaGroups.push(newGroup)
  }

  // 从轮换组中移除人员
  const removeAndToLeftList = (index: number, member: string, group: rotaGroup, rotaGroups: rotaGroup[]) => {
    // 从当前组中移除成员
    group.members.splice(index, 1)

    // 检查组是否为空，若为空则删除该组
    if (group.members.length === 0) {
      const groupIndex = rotaGroups.findIndex((g) => g.id === group.id)
      if (groupIndex !== -1) {
        rotaGroups.splice(groupIndex, 1)
      }
    }
  }

  // 处理拖拽结束
  const handleDragEnd = (rotaGroups: rotaGroup[]) => {
    rotaGroups.forEach((group, index) => {
      if (group.members.length === 0) {
        rotaGroups.splice(index, 1)
      }
    })

    rotaGroups.forEach((group, index) => {
      group.name = `${String.fromCharCode(65 + index)}`
    })
  }

  // 获取用户显示名称
  const getUserByUsername = (username: string) => {
    return userToolsStore.getOnlyDisplayName(username) || username
  }

  return {
    members,
    addRotaGroup,
    removeAndToLeftList,
    handleDragEnd,
    getUserByUsername
  }
}
