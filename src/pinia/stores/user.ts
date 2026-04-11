import { ref } from "vue"
import store from "@/pinia"
import { defineStore } from "pinia"
import { useTagsViewStore } from "./tags-view"
import { useSettingsStore } from "./settings"
import { resetRouter } from "@/router"
import { getProfileApi } from "@/api/iam/user"
import type * as user from "@/api/iam/user/type"
import { usePermissionStoreHook } from "./permission"
import { removeToken, setToken as _setToken } from "@@/utils/cache/cookies"
import { logoutApi } from "@/api/iam/user"

export const useUserStore = defineStore(
  "user",
  () => {
    const token = ref<string>("")
    const username = ref<string>("")
    const userInfo = ref<user.User | null>(null)
    const roles = ref<string[]>(["admin"]) // TODO: 从 IAM 获取真实的 roles

    const tagsViewStore = useTagsViewStore()
    const settingsStore = useSettingsStore()
    const permissionStore = usePermissionStoreHook()

    let _infoPromise: Promise<void> | null = null

    /** 获取登录用户信息 */
    const getInfo = async () => {
      if (userInfo.value) return
      if (_infoPromise) return _infoPromise

      _infoPromise = (async () => {
        try {
          const { data } = await getProfileApi()
          userInfo.value = data.user
          username.value = data.user.username
        } finally {
          _infoPromise = null
        }
      })()

      return _infoPromise
    }

    /** 统一解析用户详情（安全模式：仅缓存自己，别人按需查询） */
    const resolveUser = async (un: string): Promise<user.User | null> => {
      if (!un) return null

      // 1. 确保已获取“我”的信息
      await getInfo()

      // 2. 如果查的是“自己”，精准返回缓存
      if (username.value === un && userInfo.value) {
        return userInfo.value
      }

      // 3. 查的是别人，发起请求但不存入全局 Store 缓存
      // TODO: 等待 IAM 实现相关查询接口
      return null
    }

    // 设置 Token
    const setToken = (value: string) => {
      token.value = value
      _setToken(value)
    }

    /** 登出 */
    const logout = async () => {
      try {
        await logoutApi()
      } finally {
        resetToken()
        permissionStore.dynamicRoutes = []
        resetRouter()
        _resetTagsView()
        window.location.href = "/login"
      }
    }

    /** 重置 Token */
    const resetToken = () => {
      removeToken()
      token.value = ""
      userInfo.value = null
    }

    /** 重置 Visited Views 和 Cached Views */
    const _resetTagsView = () => {
      if (!settingsStore.cacheTagsView) {
        tagsViewStore.delAllVisitedViews()
        tagsViewStore.delAllCachedViews()
      }
    }

    const changeRoles = (val: string) => {
      roles.value = [val]
    }

    return {
      username,
      userInfo,
      roles,
      setToken,
      getInfo,
      resolveUser,
      logout,
      resetToken,
      changeRoles
    }
  },
  {
    persist: true
  }
)

/** 在 setup 外使用 */
export function useUserStoreHook() {
  return useUserStore(store)
}
