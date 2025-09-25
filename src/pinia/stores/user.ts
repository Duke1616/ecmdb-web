import { ref } from "vue"
import store from "@/pinia"
import { defineStore } from "pinia"
import { useTagsViewStore } from "./tags-view"
import { useSettingsStore } from "./settings"
import { resetRouter } from "@/router"
import { getUserInfoApi } from "@/api/user"
import { usePermissionStoreHook } from "./permission"
import { removeToken, getToken, setToken as _setToken } from "@@/utils/cache/cookies"
import { logoutApi } from "@/pages/login/apis"

export const useUserStore = defineStore("user", () => {
  const token = ref<string>("")
  const roles = ref<string[]>([])
  const username = ref<string>("")
  const userId = ref<number>(0)

  const tagsViewStore = useTagsViewStore()
  const settingsStore = useSettingsStore()
  const permissionStore = usePermissionStoreHook()

  /** 获取用户详情 */
  const getInfo = async () => {
    const { data } = await getUserInfoApi()
    username.value = data.username
    userId.value = data.id
    // 验证返回的 roles 是否为一个非空数组，否则塞入一个没有任何作用的默认角色，防止路由守卫逻辑进入无限循环
    // roles.value = data.role_codes?.length > 0 ? data.role_codes : routeSettings.defaultRoles
  }

  // 设置 Token
  const setToken = (value: string) => {
    if (getToken() !== undefined) {
      token.value = value
      return
    }

    // 如果 token 未改变，则不进行任何操作
    if (token.value === value) {
      return
    }

    // 设置token
    _setToken(value)
    token.value = value
  }

  /** 模拟角色变化 */
  const changeRoles = async (role: string) => {
    console.log(role)
    // 用刷新页面代替重新登录
    window.location.reload()
  }

  /** 登出 */
  const logout = async () => {
    try {
      // 调用登出接口
      await logoutApi()
    } catch (error) {
      console.error("登出接口调用失败:", error)
      // 即使接口调用失败，也要执行本地清理
    } finally {
      // 清空token
      resetToken()

      // 清空动态路由
      permissionStore.dynamicRoutes = []

      // 重制路由
      resetRouter()

      // 重置访问视图和缓存视图
      _resetTagsView()

      // 跳转到登录页面
      window.location.href = "/login"
    }
  }

  /** 重置 Token */
  const resetToken = () => {
    removeToken()
    token.value = ""
    roles.value = []
  }

  /** 重置 Visited Views 和 Cached Views */
  const _resetTagsView = () => {
    if (!settingsStore.cacheTagsView) {
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return { roles, username, userId, setToken, getInfo, changeRoles, logout, resetToken }
})

/** 在 setup 外使用 */
export function useUserStoreHook() {
  return useUserStore(store)
}
