import {
  type Router,
  type RouteRecordNormalized,
  type RouteRecordRaw,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from "vue-router"
import { cloneDeep, omit } from "lodash-es"
import { menu } from "@/api/menu/types/menu"

const Layouts = import.meta.glob("../layouts/index.vue")
const modules = import.meta.glob("../views/**/*.vue")

/** 将获取的后端路由数据格式调整成前端格式 */
export const transformDynamicRoutes = (backendRoutes: menu[] | []) => {
  return backendRoutes.map((route): RouteRecordRaw => {
    // 定义一个 dd空的 RouteRecordRaw 对象
    let tmpRouteItem: RouteRecordRaw = {} as RouteRecordRaw

    // console.log(backendRoutes, route)
    // 如果有子路由，则递归调用此函数将其也转化为前端格式
    if (route.children && route.type === 1) {
      tmpRouteItem = {
        path: route.path,
        component: Layouts["../layouts/index.vue"],
        name: route.name,
        redirect: route.redirect,
        meta: {
          title: route.meta.title,
          svgIcon: route.meta.icon,
          affix: route.meta.is_affix,
          hidden: route.meta.is_hidden,
          buttons: route.meta.buttons,
          // 将后端的 platform 字符串转换为前端的 platforms 数组
          platforms: route.meta.platforms
        },
        children: transformDynamicRoutes(route.children)
      }
    } else {
      tmpRouteItem = {
        path: route.path,
        component: modules[`..${route.component}`],
        name: route.name,
        meta: {
          title: route.meta.title,
          affix: route.meta.is_affix,
          svgIcon: route.meta.icon,
          hidden: route.meta.is_hidden,
          keepAlive: route.meta.is_keepalive,
          buttons: route.meta.buttons,
          // 将后端的 platform 字符串转换为前端的 platforms 数组
          platforms: route.meta.platforms
        }
      }
    }
    return tmpRouteItem
  })
}

/** 路由模式 */
export const history =
  import.meta.env.VITE_ROUTER_HISTORY === "hash"
    ? createWebHashHistory(import.meta.env.VITE_PUBLIC_PATH)
    : createWebHistory(import.meta.env.VITE_PUBLIC_PATH)

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
    history,
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
      // 如果 routeModule 的 children 属性中不包含该路由，则将其添加进去
      if (!routeModule.children.includes(route)) {
        routeModule.children.push(route)
      }
      // 如果该子路由还有自己的子路由，则递归调用此函数将它们也添加进去
      if (child.children?.length) {
        addToChildren(routes, child.children, routeModule)
      }
    }
  })
}
