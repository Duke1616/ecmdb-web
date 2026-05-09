import type { Router } from "vue-router"
import { useUserStoreHook } from "@/pinia/stores/user"
import { usePermissionStoreHook } from "@/pinia/stores/permission"
import { ElMessage } from "element-plus"
import { setRouteChange } from "@/common/composables/useRouteListener"
import { useTitle } from "@/common/composables/useTitle"
import { getToken } from "@@/utils/cache/cookies"
import isWhiteList from "@/router/white-list"
import NProgress from "nprogress"
import "nprogress/nprogress.css"

const { setTitle } = useTitle()
NProgress.configure({ showSpinner: false })
const LOGIN_PATH = "/login"

export function registerNavigationGuard(router: Router) {
  router.beforeEach(async (to, _from) => {
    NProgress.start()
    const userStore = useUserStoreHook()
    const permissionStore = usePermissionStoreHook()

    // 1. 免登录白名单处理
    if (isWhiteList(to)) {
      // 如果已登录且进入登录页，建议重定向到首页
      if (to.path === LOGIN_PATH && getToken()) {
        return "/"
      }
      return true
    }

    // 2. 检查是否有 Token
    if (!getToken()) {
      return LOGIN_PATH
    }

    // 如果用户已经获得其权限路由则直接进入
    if (permissionStore.routes.length !== 0) return true

    // 否则要重新获取权限角色
    try {
      // 1. 先拉取用户信息 (头像、昵称等)
      await userStore.getInfo()
      // 2. 再生成可访问的 Routes
      await permissionStore.setRoutes()
      // 将 "有访问权限的动态路由" 添加到 Router 中
      permissionStore.dynamicRoutes.forEach((route) => router.addRoute(route))
      // 确保添加路由已完成
      // 设置 replace: true, 因此导航将不会留下历史记录
      return { ...to, replace: true }
    } catch (err: any) {
      // 过程中发生任何错误
      NProgress.done()
      const status = err.code || err.status || err.response?.status

      // 仅在明确的认证失败（401）时重置 Token 并跳转登录
      if (status === 401) {
        userStore.resetToken()
        ElMessage.error("登录已过期，请重新登录")
        return LOGIN_PATH
      }

      // 如果是 500 等服务器错误，不清除 Token，跳转到专门的 500 错误页
      // 避免留在原地显示空白或加载中状态
      ElMessage.error(err.message || "系统服务异常，请稍后再试")
      return "/500"
    }
  })

  // 全局后置钩子
  router.afterEach((to) => {
    setRouteChange(to)
    setTitle(to.meta.title)
    NProgress.done()
  })
}
