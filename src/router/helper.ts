import { type RouteRecordRaw, type RouteMeta } from "vue-router"
import { cloneDeep } from "lodash-es"
import { type Menu, type Meta } from "@/api/iam/permission/type"
import type { SvgName } from "~virtual/svg-component"

/** 所有组件映射表 */
const Layouts = import.meta.glob("../layouts/index.vue")
const Views = import.meta.glob(["../views/**/*.vue", "../pages/**/*.vue"])

/**
 * 转换后端 Meta 为前端路由 Meta
 * @param meta 后端 Meta 数据
 * @returns 经过转换的 RouteMeta
 */
const transformMeta = (meta: Meta): RouteMeta => ({
  title: meta.title,
  svgIcon: meta.icon as SvgName,
  affix: meta.is_affix,
  hidden: meta.is_hidden,
  keepAlive: meta.is_keepalive,
  platforms: meta.platforms
})

/**
 * 将后端多级菜单树转换为前端动态路由配置
 * @param backendRoutes 接口返回的原始菜单树
 * @returns 递归转换后的路由配置数组
 */
export const transformDynamicRoutes = (backendRoutes: Menu[] = []): RouteRecordRaw[] => {
  return backendRoutes.map((route): RouteRecordRaw => {
    // 判定是否为顶级根路由
    const isRoot = !route.parent_id || route.parent_id === 0

    // 处理目录/带有子节点的节点
    if (route.children && route.children.length > 0) {
      return {
        path: route.path,
        name: route.name,
        redirect: route.redirect,
        // 只有根层级目录才强制使用 Layout 外层组件
        component: isRoot ? Layouts["../layouts/index.vue"] : undefined,
        meta: transformMeta(route.meta),
        children: transformDynamicRoutes(route.children)
      }
    }

    // 处理叶子节点（具体页面）
    const componentPath = `..${route.component}`
    const component = Views[componentPath]

    if (!component) {
      console.warn(`[RouteGuard] 未找到组件: ${componentPath} (节点: ${route.name})`)
    }

    return {
      path: route.path,
      name: route.name,
      component: component,
      meta: transformMeta(route.meta)
    }
  })
}

/**
 * 路由降级：将多级嵌套路由平铺为二级结构
 * 目的：解决 KeepAlive 在多级嵌套（>2层）下失效的问题，并保持侧边栏导航一致性
 * @param routes 待处理的多级路由数组
 * @returns 优化后的二级结构路由数组
 */
export const flatMultiLevelRoutes = (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
  const flattened: RouteRecordRaw[] = cloneDeep(routes)

  flattened.forEach((route) => {
    if (hasNestedChildren(route)) {
      route.children = flattenChildren(route.children!)
    }
  })

  return flattened
}

/**
 * 递归判断路由是否具有多级嵌套
 */
const hasNestedChildren = (route: RouteRecordRaw): boolean => {
  return !!route.children?.some((child) => child.children && child.children.length > 0)
}

/**
 * 核心递归平铺算法：提取所有深层后代到同一级
 */
const flattenChildren = (children: RouteRecordRaw[]): RouteRecordRaw[] => {
  const result: RouteRecordRaw[] = []

  children.forEach((child) => {
    if (child.children && child.children.length > 0) {
      // 提取当前层级的信息（保留，但移除 children，因为后代会被平铺到外面）
      const { children: descendants, ...nodeInfo } = child
      result.push(nodeInfo as RouteRecordRaw)

      // 递归处理后代并加入平铺队列
      result.push(...flattenChildren(descendants))
    } else {
      result.push(child)
    }
  })

  // 确保同级下的 Path 的一致性（可选：根据业务需求是否需要处理前缀补全）
  return result
}
