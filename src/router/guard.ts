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
    // 这个页面不做任何的拦截
    if (to.path === "/logicflow-preview") {
      return true
    }

    // 如果没有登陆
    if (!getToken()) {
      // 如果在免登录的白名单中，则直接进入
      if (isWhiteList(to)) return true
      // 其他没有访问权限的页面将被重定向到登录页面
      return LOGIN_PATH
    }

    // 如果已经登录，并准备进入 Login 页面，则重定向到主页
    if (to.path === LOGIN_PATH) return "/"

    // 如果用户已经获得其权限路由则直接进入
    if (permissionStore.routes.length !== 0) return true

    // 否则要重新获取权限角色
    try {
      // 生成可访问的 Routes
      await permissionStore.setRoutes()
      // 将 "有访问权限的动态路由" 添加到 Router 中
      permissionStore.dynamicRoutes.forEach((route) => router.addRoute(route))
      // 确保添加路由已完成
      // 设置 replace: true, 因此导航将不会留下历史记录
      return { ...to, replace: true }
    } catch (err: any) {
      // 过程中发生任何错误，都直接重置 Token，并重定向到登录页面
      userStore.resetToken()
      ElMessage.error(err.message || "路由守卫过程发生错误")
      return LOGIN_PATH
    }
  })

  // 全局后置钩子
  router.afterEach((to) => {
    setRouteChange(to)
    setTitle(to.meta.title)
    NProgress.done()
  })
}
