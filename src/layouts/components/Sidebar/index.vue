<script lang="ts" setup>
import { computed, watch } from "vue"
import { useRoute } from "vue-router"
import { useAppStore } from "@/pinia/stores/app"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useSidebarStore } from "@/pinia/stores/sidebar"
import SidebarItem from "./SidebarItem.vue"
import Logo from "../Logo/index.vue"
import { useDevice } from "@/common/composables/useDevice"
import { useLayoutMode } from "@/common/composables/useLayoutMode"
import { getCssVar } from "@/common/utils/css"
// import lodash from "lodash"
const v3SidebarMenuBgColor = getCssVar("--v3-sidebar-menu-bg-color")
const v3SidebarMenuTextColor = getCssVar("--v3-sidebar-menu-text-color")
const v3SidebarMenuActiveTextColor = getCssVar("--v3-sidebar-menu-active-text-color")

const { isMobile } = useDevice()
const { isLeft, isTop } = useLayoutMode()
const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()
const settingsStore = useSettingsStore()
const sidebarStore = useSidebarStore()
const activeMenu = computed(() => {
  const {
    meta: { activeMenu },
    path
  } = route
  return activeMenu ? activeMenu : path
})
// 结合权限过滤和平台过滤
const currentroutes = computed(() => {
  // 首先进行权限过滤
  const permissionFilteredRoutes = permissionStore.routes.filter((item) => !item.meta?.hidden)

  // 如果侧边栏存储有平台过滤，则应用平台过滤
  if (sidebarStore.currentPlatform) {
    return sidebarStore.filteredRoutes
  }

  // 否则返回权限过滤后的路由
  return permissionFilteredRoutes
})
const isCollapse = computed(() => !appStore.sidebar.opened)
const isLogo = computed(() => isLeft.value && settingsStore.showLogo)
const backgroundColor = computed(() => (isLeft.value ? v3SidebarMenuBgColor : undefined))
const textColor = computed(() => (isLeft.value ? v3SidebarMenuTextColor : undefined))
const activeTextColor = computed(() => (isLeft.value ? v3SidebarMenuActiveTextColor : undefined))
const sidebarMenuItemHeight = computed(() => {
  return !isTop.value ? "var(--v3-sidebar-menu-item-height)" : "var(--v3-navigationbar-height)"
})
const sidebarMenuHoverBgColor = computed(() => {
  return !isTop.value ? "var(--v3-sidebar-menu-hover-bg-color)" : "transparent"
})
const tipLineWidth = computed(() => {
  return !isTop.value ? "2px" : "0px"
})
// 当为顶部模式时隐藏垂直滚动条
const hiddenScrollbarVerticalBar = computed(() => {
  return isTop.value ? "none" : "block"
})

/** 获取当前页面的平台标识 */
const getCurrentPlatform = (currentRoute: any) => {
  // 从当前路由的 meta.platforms 中获取平台标识
  const routePlatforms = currentRoute.meta?.platforms
  if (routePlatforms && routePlatforms.length > 0) {
    return routePlatforms[0] // 取第一个平台作为当前平台
  }

  return ""
}

// 监听路由变化，更新平台过滤
watch(
  () => route,
  (newval) => {
    // 如果是 navigation 页面，显示所有菜单，不进行平台过滤
    if (newval.path === "/navigation") {
      const noHiddenRoutes = permissionStore.routes.filter((item) => !item.meta?.hidden)
      sidebarStore.setPlatformFilter("", noHiddenRoutes, false) // 不是来自 navigation 跳转
      return
    }

    const currentPlatform = getCurrentPlatform(newval)

    // 如果来自 navigation 跳转，保持当前的平台过滤
    if (sidebarStore.isFromNavigation) {
      return
    }

    if (currentPlatform !== sidebarStore.currentPlatform) {
      // 通过菜单选择，不进行平台过滤和扁平化，显示所有菜单
      const noHiddenRoutes = permissionStore.routes.filter((item) => !item.meta?.hidden)
      sidebarStore.setPlatformFilter("", noHiddenRoutes, false) // 空字符串表示显示所有，不扁平化
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <div :class="{ 'has-logo': isLogo }">
    <Logo v-if="isLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse && !isTop"
        :background-color="backgroundColor"
        :text-color="textColor"
        :active-text-color="activeTextColor"
        :unique-opened="true"
        :collapse-transition="false"
        :mode="isTop && !isMobile ? 'horizontal' : 'vertical'"
      >
        <SidebarItem v-for="route in currentroutes" :key="route.path" :item="route" :base-path="route.path" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
%tip-line {
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: v-bind(tipLineWidth);
    height: 100%;
    background-color: var(--v3-sidebar-menu-tip-line-bg-color);
  }
}

.has-logo {
  .el-scrollbar {
    // 多 1% 是为了在左侧模式时侧边栏最底部不显示 1px 左右的白色线条
    height: calc(101% - var(--v3-header-height));
  }
}

.el-scrollbar {
  // 多 1% 是为了在顶部模式时防止垂直滚动
  height: 101%;
  :deep(.scrollbar-wrapper) {
    // 限制水平宽度
    overflow-x: hidden !important;
    .el-scrollbar__view {
      height: 100%;
    }
  }
  // 滚动条
  :deep(.el-scrollbar__bar) {
    &.is-horizontal {
      // 隐藏水平滚动条
      display: none;
    }
    &.is-vertical {
      // 当为顶部模式时隐藏垂直滚动条
      display: v-bind(hiddenScrollbarVerticalBar);
    }
  }
}

.el-menu {
  border: none;
  min-height: 100%;
  width: 100% !important;
}

.el-menu--horizontal {
  height: v-bind(sidebarMenuItemHeight);
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title),
:deep(.el-sub-menu .el-menu-item),
:deep(.el-menu--horizontal .el-menu-item) {
  height: v-bind(sidebarMenuItemHeight);
  line-height: v-bind(sidebarMenuItemHeight);
  &.is-active,
  &:hover {
    background-color: v-bind(sidebarMenuHoverBgColor);
  }
}

:deep(.el-sub-menu) {
  &.is-active {
    > .el-sub-menu__title {
      color: v-bind(activeTextColor) !important;
    }
  }
}

:deep(.el-menu-item.is-active) {
  @extend %tip-line;
}

.el-menu--collapse {
  :deep(.el-sub-menu.is-active) {
    .el-sub-menu__title {
      @extend %tip-line;
    }
  }
}
</style>
