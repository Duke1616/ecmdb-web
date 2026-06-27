import { ref } from "vue"
import { ElMessage } from "element-plus"
import type { User as IIamUser } from "@/api/iam/user/type"
import type { OnCallGroup } from "@/api/alert/oncall/types/oncall"
import { useUserToolsStore } from "@/pinia/stores/user-tools"

export function usePersonnelManagement() {
  const userToolsStore = useUserToolsStore()
  const members = ref<string[]>([])

  // 添加人员到轮换组
  const addOnCallGroup = (user: IIamUser, rotaGroups: OnCallGroup[]) => {
    // 检查用户是否已经存在于任何组中
    const userExists = rotaGroups.some((group) => group.members.includes(user.username))

    if (userExists) {
      ElMessage.warning("该用户已在排班组中")
      return
    }

    const newGroupName = `${String.fromCharCode(65 + rotaGroups.length)}`
    const newGroup = {
      id: Date.now(),
      name: newGroupName,
      members: [user.username]
    }

    // 缓存用户信息
    userToolsStore.setDisplayName(user.username, `${user.nickname || user.username} [${user.username}]`)
    rotaGroups.push(newGroup)
  }

  // 从轮换组中移除人员
  const removeAndToLeftList = (index: number, member: string, group: OnCallGroup, rotaGroups: OnCallGroup[]) => {
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
  const handleDragEnd = (rotaGroups: OnCallGroup[]) => {
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
    return userToolsStore.getNickname(username) || username
  }

  return {
    members,
    addOnCallGroup,
    removeAndToLeftList,
    handleDragEnd,
    getUserByUsername
  }
}
