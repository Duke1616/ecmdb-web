import { defineStore } from "pinia"
import { ref } from "vue"
import store from "@/pinia"
import { findByUsernamesApi } from "@/api/user"

export const useUserToolsStore = defineStore("user-tools", () => {
  const userMap = ref(new Map<string, string>())

  const setByUsernames = (members: string[]) => {
    // 查看是否为空
    if (!members || members.length === 0) return

    // 去重
    const uniqueMembers = Array.from(new Set(members))

    // 筛选出 userMap 中没有的用户名
    const missingMembers = uniqueMembers.filter((username) => !userMap.value.has(username))

    // 如果所有用户都已存在，则不处理
    if (missingMembers.length === 0) return

    // 获取用户信息存储到 map 中
    findByUsernamesApi(missingMembers)
      .then((data) => {
        const newUsers = new Map(
          data.data.users.map((user) => [user.username, user.display_name + " [" + user.username + "] "])
        )
        newUsers.forEach((name, username) => userMap.value.set(username, name))
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  }

  const setToMap = (username: string, name: string) => {
    userMap.value.set(username, name)
  }

  const getUsername = (username: string) => {
    return userMap.value.get(username)
  }

  const getOnlyDisplayName = (username: string) => {
    return userMap.value.get(username)?.split(" [")[0]
  }
  return { userMap, setByUsernames, setToMap, getUsername, getOnlyDisplayName }
})

/** 在 setup 外使用 */
export function useUserToolsStoreHook() {
  return useUserToolsStore(store)
}
