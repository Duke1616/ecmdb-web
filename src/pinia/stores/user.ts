import { ref } from "vue"
import store from "@/pinia"
import { defineStore } from "pinia"
import { useTagsViewStore } from "./tags-view"
import { useSettingsStore } from "./settings"
import { resetRouter } from "@/router"
import { getProfileApi, logoutApi, listUsersApi } from "@/api/iam/user"
import type * as user from "@/api/iam/user/type"
import { usePermissionStoreHook } from "./permission"
import { removeToken, setToken as _setToken } from "@@/utils/cache/cookies"
import { switchTenantApi } from "@/api/iam/tenant"

// ============================================================
// 通用工具函数
// ============================================================

/**
 * 创建单例 Promise 包装器
 * 确保同一异步操作在并发场景下只执行一次，防止重复请求
 */
function createSingletonPromise<T>(executor: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null
  return async () => {
    if (promise) return promise
    promise = executor()
    try {
      return await promise
    } finally {
      promise = null
    }
  }
}

/**
 * 创建批量请求解析器
 * 利用微任务队列将同一事件循环内的多次调用合并为一次批量请求，并缓存结果
 */
function createBatchResolver<TKey, TValue>(options: {
  execute: (keys: TKey[]) => Promise<Map<TKey, TValue>>
}): (key: TKey) => Promise<TValue | null> {
  const cache = new Map<TKey, TValue | null>()
  let pending: Set<TKey> | null = null
  let batchPromise: Promise<void> | null = null

  const flushBatch = async () => {
    if (!pending?.size) return
    const keys = Array.from(pending)
    pending = null

    try {
      const results = await options.execute(keys)
      for (const [key, value] of results) {
        cache.set(key, value)
      }
      for (const key of keys) {
        if (!cache.has(key)) {
          cache.set(key, null)
        }
      }
    } catch (error) {
      console.error("Batch resolver failed:", error)
      for (const key of keys) {
        if (!cache.has(key)) {
          cache.set(key, null)
        }
      }
    }
  }

  return async (key: TKey): Promise<TValue | null> => {
    if (cache.has(key)) {
      return cache.get(key) ?? null
    }

    if (!pending) pending = new Set()
    pending.add(key)

    if (!batchPromise) {
      batchPromise = new Promise((resolve) => {
        Promise.resolve().then(() => {
          flushBatch().then(() => {
            batchPromise = null
            resolve()
          })
        })
      })
    }

    await batchPromise
    return cache.get(key) ?? null
  }
}

// ============================================================
// Store 定义
// ============================================================

export const useUserStore = defineStore(
  "user",
  () => {
    // -------------------- State --------------------
    const token = ref("")
    const username = ref("")
    const userInfo = ref<user.User | null>(null)
    const tenants = ref<user.Tenant[]>([])
    const currentTenantId = ref(0)
    const isAdmin = ref(false)
    const permissions = ref<string[]>([])
    const roles = ref<string[]>(["admin"])

    // -------------------- 依赖 Store --------------------
    const tagsViewStore = useTagsViewStore()
    const settingsStore = useSettingsStore()
    const permissionStore = usePermissionStoreHook()

    // -------------------- Actions --------------------

    /**
     * 获取当前登录用户资料（带 Promise 单例缓存，防止并发重复请求）
     */
    const fetchCurrentUser = createSingletonPromise(async () => {
      const { data } = await getProfileApi()
      userInfo.value = data.user
      username.value = data.user.username
      tenants.value = data.tenants ?? []
      currentTenantId.value = data.current_tenant_id
      isAdmin.value = data.is_admin
      permissions.value = data.permissions ?? []
    })

    /**
     * 批量用户详情解析器（内部使用，合并请求 + 内存缓存）
     */
    const batchUserResolver = createBatchResolver<string, user.User>({
      execute: async (usernames) => {
        const { data } = await listUsersApi({
          usernames,
          offset: 0,
          limit: usernames.length
        })
        const result = new Map<string, user.User>()
        for (const u of data?.users ?? []) {
          result.set(u.username, u)
        }
        return result
      }
    })

    /**
     * 根据用户名获取用户详情
     * 优先返回当前登录用户（免查询），否则走批量查询解析器
     */
    const getUserByUsername = async (targetUsername: string): Promise<user.User | null> => {
      if (!targetUsername) return null

      await fetchCurrentUser()
      if (username.value === targetUsername && userInfo.value) {
        return userInfo.value
      }

      return batchUserResolver(targetUsername)
    }

    /**
     * 批量根据用户名获取用户详情
     * 自动去重并利用内部缓存，合并为一次网络请求
     */
    const batchGetUsersByUsername = async (targetUsernames: string[]): Promise<user.User[]> => {
      if (!targetUsernames.length) return []

      const uniqueNames = [...new Set(targetUsernames)]
      const users = await Promise.all(uniqueNames.map((un) => getUserByUsername(un)))
      return users.filter((u): u is user.User => u !== null)
    }

    /**
     * 切换当前租户
     */
    const switchTenant = async (tenant: user.Tenant) => {
      try {
        await switchTenantApi(tenant.id)
        window.location.href = "/navigation"
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "切换租户失败"
        ElMessage.error(message)
      }
    }

    /**
     * 设置登录 Token
     */
    const setToken = (value: string) => {
      token.value = value
      _setToken(value)
    }

    /**
     * 重置 Token 及相关状态
     */
    const resetToken = () => {
      removeToken()
      token.value = ""
      userInfo.value = null
    }

    /**
     * 退出登录并清空所有状态
     */
    const logout = async () => {
      try {
        await logoutApi()
      } finally {
        resetToken()
        permissionStore.dynamicRoutes = []
        resetRouter()
        if (!settingsStore.cacheTagsView) {
          tagsViewStore.delAllVisitedViews()
          tagsViewStore.delAllCachedViews()
        }
        window.location.href = "/login"
      }
    }

    /**
     * 切换当前角色（用于权限测试）
     */
    const changeRoles = (val: string) => {
      roles.value = [val]
    }

    // -------------------- 返回值 --------------------
    return {
      // State
      token,
      username,
      userInfo,
      tenants,
      currentTenantId,
      isAdmin,
      permissions,
      roles,
      // Actions
      fetchCurrentUser,
      getUserByUsername,
      batchGetUsersByUsername,
      switchTenant,
      setToken,
      resetToken,
      logout,
      changeRoles
    }
  },
  { persist: true }
)

/** 在 setup 外使用 */
export function useUserStoreHook() {
  return useUserStore(store)
}
