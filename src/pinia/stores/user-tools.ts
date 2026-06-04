import { defineStore } from "pinia"
import { ref } from "vue"
import store from "@/pinia"
import { useUserStore } from "./user"

export const useUserToolsStore = defineStore("user-tools", () => {
  /** 用户名 → 展示名称 的内存缓存映射 */
  const displayNameCache = ref(new Map<string, string>())
  const userStore = useUserStore()

  /**
   * 批量解析用户名，获取用户的展示名称并缓存
   * @param usernames 用户名数组
   */
  const batchResolveUsers = async (usernames: string[]) => {
    if (!usernames?.length) return

    const uniqueNames = [...new Set(usernames)]
    const missingNames = uniqueNames.filter((name) => !displayNameCache.value.has(name))
    if (!missingNames.length) return

    await Promise.all(
      missingNames.map(async (name) => {
        try {
          const userInfo = await userStore.getUserByUsername(name)
          if (userInfo) {
            const displayName = `${userInfo.nickname || userInfo.username} [${userInfo.username}]`
            displayNameCache.value.set(name, displayName)
          }
        } catch (error) {
          console.error(`批量解析用户失败: ${name}`, error)
        }
      })
    )
  }

  /**
   * 手动设置用户的展示名称缓存
   */
  const setDisplayName = (username: string, displayName: string) => {
    displayNameCache.value.set(username, displayName)
  }

  /**
   * 获取用户的完整展示名称（格式：nickname [username]）
   */
  const getFullDisplayName = (username: string): string | undefined => {
    return displayNameCache.value.get(username)
  }

  /**
   * 仅获取用户的昵称（不含 username 后缀）
   */
  const getNickname = (username: string): string | undefined => {
    return displayNameCache.value.get(username)?.split(" [")[0]
  }

  return {
    displayNameCache,
    batchResolveUsers,
    setDisplayName,
    getFullDisplayName,
    getNickname
  }
})

/** 在 setup 外使用 */
export function useUserToolsStoreHook() {
  return useUserToolsStore(store)
}
