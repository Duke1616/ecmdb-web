import { ref } from "vue"
import store from "@/pinia"
import { defineStore } from "pinia"
import { useTagsViewStore } from "./tags-view"
import { useSettingsStore } from "./settings"
import { resetRouter } from "@/router"
import { getProfileApi, logoutApi, userDetailApi, listUsersApi } from "@/api/iam/user"
import type * as user from "@/api/iam/user/type"
import { usePermissionStoreHook } from "./permission"
import { removeToken, setToken as _setToken } from "@@/utils/cache/cookies"
import { switchTenantApi } from "@/api/iam/tenant"

/**
 * 安全请求封装函数，用以精简 store 内的 try-catch，并在出错时提供降级防护
 * @param req 异步请求方法
 */
async function safeRequest<T>(req: () => Promise<T>): Promise<T | null> {
  try {
    return await req()
  } catch (error) {
    console.warn("safeRequest caught error:", error)
    return null
  }
}

export const useUserStore = defineStore(
  "user",
  () => {
    const token = ref("")
    const username = ref("")
    const userInfo = ref<user.User | null>(null)
    const tenants = ref<user.Tenant[]>([])
    const currentTenantId = ref(0)
    const isAdmin = ref(false)
    const permissions = ref<string[]>([])
    const roles = ref<string[]>(["admin"])

    const tagsViewStore = useTagsViewStore()
    const settingsStore = useSettingsStore()
    const permissionStore = usePermissionStoreHook()

    /**
     * 获取当前登录用户信息（闭包单例 Promise 缓存，全局防止并发请求风暴）
     */
    const getInfo = (() => {
      let promise: Promise<void> | null = null
      return async () => {
        if (promise) return promise
        promise = (async () => {
          const { data } = await getProfileApi()
          userInfo.value = data.user
          username.value = data.user.username
          tenants.value = data.tenants || []
          currentTenantId.value = data.current_tenant_id
          isAdmin.value = data.is_admin
          permissions.value = data.permissions || []
        })()
        try {
          await promise
        } finally {
          promise = null
        }
      }
    })()

    /**
     * 统一解析用户详情（二阶段防御降级检索）
     * @param un 目标用户名
     */
    const resolveUser = async (un: string): Promise<user.User | null> => {
      if (!un) return null
      await getInfo()
      if (username.value === un && userInfo.value) return userInfo.value

      // 1. 优先采用详情接口反解
      const userDetail = await safeRequest(() => userDetailApi({ username: un }))
      if (userDetail?.data?.user) return userDetail.data.user

      // 2. 详情查询报错/权限受限时，降级使用列表查询精确过滤
      const userList = await safeRequest(() => listUsersApi({ keyword: un, offset: 0, limit: 10 }))
      return userList?.data?.users?.find((u) => u.username === un) || null
    }

    /**
     * 切换租户
     * @param tenant 目标租户
     */
    const switchTenant = async (tenant: user.Tenant) => {
      try {
        await switchTenantApi(tenant.id)
        // 切换租户后跳转到首页导航页并刷新，以重新执行路由守卫并加载新权限
        window.location.href = "/navigation"
      } catch (err: any) {
        ElMessage.error(err.message || "切换租户失败")
      }
    }

    const setToken = (value: string) => {
      token.value = value
      _setToken(value)
    }

    const resetToken = () => {
      removeToken()
      token.value = ""
      userInfo.value = null
    }

    /**
     * 登出系统并清空状态
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

    const changeRoles = (val: string) => {
      roles.value = [val]
    }

    return {
      token,
      username,
      userInfo,
      tenants,
      currentTenantId,
      isAdmin,
      permissions,
      roles,
      getInfo,
      resolveUser,
      switchTenant,
      setToken,
      resetToken,
      logout,
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
