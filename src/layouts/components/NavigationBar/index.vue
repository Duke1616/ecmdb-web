<script lang="ts" setup>
import { useRouter } from "vue-router"
import { storeToRefs } from "pinia"
import { useAppStore } from "@/pinia/stores/app"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import { UserFilled, OfficeBuilding } from "@element-plus/icons-vue"
import Hamburger from "../Hamburger/index.vue"
import Breadcrumb from "../Breadcrumb/index.vue"
import Sidebar from "../Sidebar/index.vue"
import Notify from "@@/components/Notify/index.vue"
import Screenfull from "@@/components/Screenfull/index.vue"
import SearchMenu from "@@/components/SearchMenu/index.vue"
import { useDevice } from "@/common/composables/useDevice"
import { useLayoutMode } from "@/common/composables/useLayoutMode"

const { isMobile } = useDevice()
const { isTop } = useLayoutMode()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const { showNotify, showScreenfull, showSearchMenu } = storeToRefs(settingsStore)

/** 当前激活的租户对象 */
const currentTenant = computed(() => {
  return userStore.tenants.find((t) => t.id === userStore.currentTenantId)
})

/** 切换侧边栏 */
const toggleSidebar = () => {
  appStore.toggleSidebar(false)
}

/** 登出 */
const logout = () => {
  userStore.logout()
  router.push("/login")
}
</script>

<template>
  <div class="navigation-bar">
    <Hamburger
      v-if="!isTop || isMobile"
      :is-active="appStore.sidebar.opened"
      class="hamburger"
      @toggle-click="toggleSidebar"
    />
    <Breadcrumb v-if="!isTop || isMobile" class="breadcrumb" />
    <Sidebar v-if="isTop && !isMobile" class="sidebar" />
    <div class="right-menu">
      <!-- 移除 v-if 强制显示，看看是什么状态 -->
      <el-dropdown class="right-menu-item tenant-select">
        <div class="tenant-display">
          <el-icon><OfficeBuilding /></el-icon>
          <span>{{ currentTenant?.name || "默认空间" }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="tenant-dropdown-menu">
            <template v-if="userStore.tenants.length > 0">
              <el-dropdown-item
                v-for="item in userStore.tenants"
                :key="item.id"
                :disabled="item.id === userStore.currentTenantId"
                @click="userStore.switchTenant(item)"
              >
                <div class="tenant-item">
                  <span class="tenant-name">{{ item.name }}</span>
                </div>
              </el-dropdown-item>
            </template>
            <el-dropdown-item v-else disabled>暂无可用空间</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <SearchMenu v-if="showSearchMenu" class="right-menu-item" />
      <Screenfull v-if="showScreenfull" class="right-menu-item" />
      <Notify v-if="showNotify" class="right-menu-item" />
      <el-dropdown class="right-menu-item">
        <div class="right-menu-avatar">
          <el-avatar :src="userStore.userInfo?.avatar" :icon="UserFilled" :size="30" />
          <span>{{ userStore.userInfo?.nickname || userStore.username }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push('/profile')">个人信息</el-dropdown-item>
            <el-dropdown-item divided @click="logout">
              <span style="display: block">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navigation-bar {
  height: var(--v3-navigationbar-height);
  overflow: hidden;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  padding: 0 16px;

  .hamburger {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 12px;
    cursor: pointer;
    &:hover {
      background-color: #f8fafc;
    }
  }

  .breadcrumb {
    flex: 1;
    margin-left: 8px;
    @media screen and (max-width: 576px) {
      display: none;
    }
  }

  .sidebar {
    flex: 1;
    min-width: 0px;
    :deep(.el-menu) {
      background-color: transparent;
      border: none;
    }
  }

  .right-menu {
    display: flex;
    align-items: center;

    .right-menu-item {
      padding: 0 10px;
      display: flex;
      align-items: center;
      cursor: pointer;
      color: #64748b;
      height: 100%;
      transition: all 0.2s;

      &:hover {
        background-color: #f8fafc;
        color: #1e293b;
      }

      &.tenant-select {
        margin-right: 8px;
        padding: 0 12px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #f1f5f9;
        height: 34px;
        .tenant-display {
          display: flex;
          align-items: center;
          gap: 8px;
          .el-icon {
            font-size: 16px;
            color: #64748b;
          }
          span {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
          }
        }
      }

      .right-menu-avatar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 8px;
        transition: background-color 0.2s;

        &:hover {
          background-color: #f8fafc;
        }

        .el-avatar {
          background-color: #f1f5f9;
          flex-shrink: 0;
        }

        span {
          font-size: 14px;
          font-weight: 500;
          color: #334155;
        }
      }
    }
  }
}

:deep(.el-dropdown-menu__item) {
  font-size: 13px;
  padding: 8px 20px;

  .tenant-item {
    display: flex;
    align-items: center;
    width: 100%;
    .tenant-name {
      font-weight: 600;
      color: #1e293b;
    }
  }
}
</style>
