import { type Router, type RouteRecordNormalized, type RouteRecordRaw, createRouter } from "vue-router"
import { cloneDeep, omit } from "lodash-es"
import { menu, meta } from "@/api/menu/types/menu"
import { routerConfig } from "@/router/config"

const Layouts = import.meta.glob("../layouts/index.vue")
const modules = {
  ...import.meta.glob("../views/**/*.vue"),
  ...import.meta.glob("../pages/**/*.vue")
}

// 公共的 meta 转换函数
const transformMeta = (meta: meta) => ({
  title: meta.title,
  svgIcon: meta.icon,
  affix: meta.is_affix,
  hidden: meta.is_hidden,
  keepAlive: meta.is_keepalive,
  buttons: meta.buttons,
  platforms: meta.platforms
})

/** 将后端路由数据转为前端格式 */
export const transformDynamicRoutes = (backendRoutes: menu[] = []): RouteRecordRaw[] => {
  return backendRoutes.map((route): RouteRecordRaw => {
    // layout 类型（目录）- 只有第一层（pid 为空）才使用 Layout
    if (route.children && route.type === 1) {
      console.log("route", route)
      return {
        path: route.path,
        component: !route.pid ? Layouts["../layouts/index.vue"] : undefined,
        name: route.name,
        redirect: route.redirect,
        meta: transformMeta(route.meta),
        children: transformDynamicRoutes(route.children)
      }
    }

    // 普通页面
    const component = modules[`..${route.component}`]
    if (!component) {
      console.warn(`未找到组件路径: ${route.component}`)
    }

    return {
      path: route.path,
      component: component,
      name: route.name,
      meta: transformMeta(route.meta)
    }
  })
}

/** 路由降级（把三级及其以上的路由转化为二级路由） */
export const flatMultiLevelRoutes = (routes: RouteRecordRaw[]) => {
  const routesMirror = cloneDeep(routes)
  routesMirror.forEach((route) => {
    // 如果路由是三级及其以上路由，对其进行降级处理
    isMultipleRoute(route) && promoteRouteLevel(route)
  })
  return routesMirror
}

/** 判断路由层级是否大于 2 */
const isMultipleRoute = (route: RouteRecordRaw) => {
  const children = route.children
  if (children?.length) {
    // 只要有一个子路由的 children 长度大于 0，就说明是三级及其以上路由
    return children.some((child) => child.children?.length)
  }
  return false
}

/** 生成二级路由 */
const promoteRouteLevel = (route: RouteRecordRaw) => {
  // 创建 router 实例是为了获取到当前传入的 route 的所有路由信息
  let router: Router | null = createRouter({
    history: routerConfig.history,
    routes: [route]
  })
  const routes = router.getRoutes()
  // 在 addToChildren 函数中使用上面获取到的路由信息来更新 route 的 children
  addToChildren(routes, route.children || [], route)
  router = null
  // 转为二级路由后，去除所有子路由中的 children
  route.children = route.children?.map((item) => omit(item, "children") as RouteRecordRaw)
}

/** 将给定的子路由添加到指定的路由模块中 */
const addToChildren = (routes: RouteRecordNormalized[], children: RouteRecordRaw[], routeModule: RouteRecordRaw) => {
  children.forEach((child) => {
    const route = routes.find((item) => item.name === child.name)
    if (route) {
      // 初始化 routeModule 的 children
      routeModule.children = routeModule.children || []
      // 检查是否已经存在相同名称的路由，避免重复添加
      const existingRoute = routeModule.children.find((item) => item.name === route.name)
      if (!existingRoute) {
        routeModule.children.push(route)
      }
      // 如果该子路由还有自己的子路由，则递归调用此函数将它们也添加进去
      if (child.children?.length) {
        addToChildren(routes, child.children, routeModule)
      }
    }
  })
}
