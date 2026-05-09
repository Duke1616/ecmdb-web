<script lang="ts" setup>
import { useRouter } from "vue-router"
import { storeToRefs } from "pinia"
import { useAppStore } from "@/pinia/stores/app"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import { UserFilled, OfficeBuilding, ArrowDown, CollectionTag, Select } from "@element-plus/icons-vue"
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
      <SearchMenu v-if="showSearchMenu" class="right-menu-item" />
      <Screenfull v-if="showScreenfull" class="right-menu-item" />
      <Notify v-if="showNotify" class="right-menu-item" />

      <div class="divider" />

      <!-- 租户/工作空间切换器 -->
      <el-dropdown class="right-menu-item tenant-select" trigger="click">
        <div class="tenant-display">
          <div class="space-icon-wrapper">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <span class="space-name">{{ currentTenant?.name || "默认空间" }}</span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <div class="tenant-dropdown-container">
            <div class="dropdown-title">切换工作空间</div>
            <el-dropdown-menu class="tenant-dropdown-menu">
              <template v-if="userStore.tenants.length > 0">
                <el-dropdown-item
                  v-for="item in userStore.tenants"
                  :key="item.id"
                  :class="{ 'is-active': item.id === userStore.currentTenantId }"
                  @click="userStore.switchTenant(item)"
                >
                  <div class="tenant-item-inner">
                    <div class="item-info">
                      <el-icon class="item-icon"><CollectionTag /></el-icon>
                      <span class="item-name">{{ item.name }}</span>
                    </div>
                    <el-icon v-if="item.id === userStore.currentTenantId" class="check-icon"><Select /></el-icon>
                  </div>
                </el-dropdown-item>
              </template>
              <div v-else class="tenant-empty">暂无可用空间</div>
            </el-dropdown-menu>
          </div>
        </template>
      </el-dropdown>

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
    height: 100%;
    padding-right: 4px;

    .right-menu-item {
      display: flex;
      align-items: center;
      height: 38px; // 统一点击区域高度
      padding: 0 10px;
      margin: 0 2px;
      cursor: pointer;
      color: #64748b;
      border-radius: 8px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background-color: #f1f5f9;
        color: #1e293b;
      }

      // 租户/工作空间切换项
      &.tenant-select {
        padding: 0 12px;
        .tenant-display {
          display: flex;
          align-items: center;
          gap: 8px;
          .space-icon-wrapper {
            display: flex;
            align-items: center;
            font-size: 16px;
            color: #3b82f6;
          }
          .space-name {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .arrow-icon {
            font-size: 12px;
            color: #94a3b8;
            transition: transform 0.3s;
          }
        }
        &:hover .arrow-icon {
          transform: translateY(1px);
        }
      }

      // 用户信息项
      .right-menu-avatar {
        display: flex;
        align-items: center;
        gap: 8px;
        .el-avatar {
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          transition: transform 0.3s ease;
        }
        span {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
      }
      &:hover .el-avatar {
        transform: scale(1.05);
      }
    }

    // 垂直分隔线
    .divider {
      width: 1px;
      height: 16px;
      background-color: #e2e8f0;
      margin: 0 12px;
    }
  }
}

.tenant-dropdown-container {
  width: 240px;
  padding: 8px 0;

  .dropdown-title {
    padding: 8px 16px 12px;
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tenant-dropdown-menu {
    border: none;
    padding: 0 8px;
  }

  .tenant-empty {
    padding: 16px;
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
  }
}

:deep(.el-dropdown-menu__item) {
  margin: 2px 0;
  padding: 10px 12px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background-color: #f1f5f9 !important;
    color: #3b82f6 !important;
  }

  &.is-active {
    background-color: #eff6ff !important;
    .item-name {
      color: #3b82f6 !important;
    }
    .item-icon {
      color: #3b82f6 !important;
    }
  }

  .tenant-item-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .item-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .item-icon {
        font-size: 16px;
        color: #94a3b8;
      }

      .item-name {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
      }
    }

    .check-icon {
      font-size: 14px;
      color: #3b82f6;
    }
  }
}
</style>
