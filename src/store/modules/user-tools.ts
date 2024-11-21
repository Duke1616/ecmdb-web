import { defineStore } from "pinia"
import { ref } from "vue"
import store from "@/store"
import { findByIdsApi } from "@/api/user"

export const useUserToolsStore = defineStore("user-tools", () => {
  const userMap = ref(new Map<number, string>())

  const setByUserIds = (members: number[]) => {
    // 查看是否为空
    if (!members || members.length === 0) return

    // 去重
    const uniqueMembers = Array.from(new Set(members))

    // 筛选出 userMap 中没有的用户 ID
    const missingMembers = uniqueMembers.filter((id) => !userMap.value.has(id))

    // 如果所有用户都已存在，则不处理
    if (missingMembers.length === 0) return

    // 获取用户信息存储到 map 中
    findByIdsApi(missingMembers)
      .then((data) => {
        const newUsers = new Map(
          data.data.users.map((user) => [user.id, user.display_name + " [" + user.username + "] "])
        )
        newUsers.forEach((name, id) => userMap.value.set(id, name))
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  }

  const setToMap = (id: number, name: string) => {
    userMap.value.set(id, name)
  }

  const getUsernme = (id: number) => {
    return userMap.value.get(id)
  }

  const getOnlyDisplayName = (id: number) => {
    return userMap.value.get(id)?.split(" [")[0]
  }
  return { userMap, setByUserIds, setToMap, getUsernme, getOnlyDisplayName }
})

/** 在 setup 外使用 */
export function useUserToolsStoreHook() {
  return useUserToolsStore(store)
}
