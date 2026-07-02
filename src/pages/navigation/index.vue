<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter, type RouteRecordRaw } from "vue-router"
import {
  ArrowRight,
  Check,
  CollectionTag,
  DocumentChecked,
  Fold,
  Key,
  Menu as MenuIcon,
  RefreshRight
} from "@element-plus/icons-vue"
import type * as ElementPlusIconsVue from "@element-plus/icons-vue"
import { getNavigationCards, platformMatches } from "@/common/constants/platforms"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useSidebarStore } from "@/pinia/stores/sidebar"

const router = useRouter()
const sidebarStore = useSidebarStore()
const permissionStore = usePermissionStore()
const settingsStore = useSettingsStore()

type ElementPlusIconsName = keyof typeof ElementPlusIconsVue

interface NavigationCard {
  id: string
  name: string
  title: string
  description: string
  icon: ElementPlusIconsName
  color: string
  route: string
  permission?: string
  summary?: string
  metrics?: string[]
}

const navigationCards = ref<NavigationCard[]>(getNavigationCards())

const hasPlatformRoutes = (platformId: string): boolean => {
  const allRoutes = permissionStore.dynamicRoutes
  if (!allRoutes || allRoutes.length === 0) return false

  const checkHasPlatform = (routes: RouteRecordRaw[]): boolean => {
    return routes.some((route) => {
      const routePlatforms = route.meta?.platforms as string[] | undefined
      if (routePlatforms?.length && platformMatches(routePlatforms, platformId)) return true
      if (route.children && route.children.length > 0) return checkHasPlatform(route.children)
      return false
    })
  }

  return checkHasPlatform(allRoutes)
}

const filteredCards = computed(() => navigationCards.value.filter((card) => hasPlatformRoutes(card.id)))

const displayCards = computed(() => {
  const order = ["ticket", "cmdb", "iam", "task", "alert"]
  return [...filteredCards.value].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
})

const handleCardClick = (card: NavigationCard) => {
  sidebarStore.setPlatformFilter(card.id, permissionStore.routes, true, settingsStore.expandSidebarOnPlatformEnter)
  router.push(card.route)
}
</script>

<template>
  <div class="navigation-page">
    <div class="bg-pattern" />

    <main class="navigation-shell">
      <section class="brand-section">
        <div class="brand-main">
          <div class="brand-mark">
            <el-icon :size="22"><MenuIcon /></el-icon>
          </div>
          <div class="brand-copy">
            <div class="brand-meta">
              <span class="eyebrow">平台导航</span>
              <span class="meta-divider" />
              <span class="meta-text">统一入口</span>
            </div>
            <h1>选择要进入的工作台</h1>
            <p>按产品域快速进入业务平台，进入后侧边菜单会自动聚焦到当前工作范围。</p>
          </div>
        </div>
        <div class="access-note" aria-label="可访问平台数量">
          <span class="access-count">{{ displayCards.length }}</span>
          <span class="access-copy">个可访问平台</span>
          <el-icon><Check /></el-icon>
        </div>
      </section>

      <div class="navigation-content">
        <section
          v-if="displayCards.length > 0"
          class="platform-grid"
          :class="{ 'grid-layout-5': displayCards.length === 5 }"
          aria-label="平台导航"
        >
          <article
            v-for="card in displayCards"
            :key="card.id"
            class="platform-card"
            :style="{ '--card-color': card.color }"
            @click="handleCardClick(card)"
          >
            <div class="card-head">
              <div class="icon-box">
                <el-icon :size="22">
                  <component :is="card.icon" />
                </el-icon>
              </div>
              <span class="platform-code">{{ card.title }}</span>
            </div>

            <div class="card-body">
              <span class="card-summary">{{ card.summary }}</span>
              <h2>{{ card.name }}</h2>
              <p>{{ card.description }}</p>
            </div>

            <div class="card-foot">
              <span>进入工作台</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </article>
        </section>

        <section v-else class="empty-panel">
          <div class="empty-visual">
            <div class="empty-orbit empty-orbit-large" />
            <div class="empty-orbit empty-orbit-small" />
            <div class="empty-icon">
              <el-icon :size="34"><Key /></el-icon>
            </div>
          </div>
          <div class="empty-copy">
            <span class="empty-kicker">暂无可访问平台</span>
            <h2>当前账号还没有分配工作台权限</h2>
            <p>平台入口会根据已授权菜单自动展示。请确认当前空间、角色或权限策略是否已经配置完成。</p>
          </div>
          <div class="empty-actions">
            <el-button type="primary" plain :icon="RefreshRight" @click="router.go(0)">刷新权限</el-button>
            <span>如刚完成授权，刷新后即可看到入口</span>
          </div>
        </section>

        <aside class="preference-panel">
          <div class="preference-head">
            <div>
              <span>进入偏好</span>
              <h2>工作台设置</h2>
            </div>
            <span class="local-badge">本地保存</span>
          </div>

          <div class="preference-list">
            <label class="preference-item">
              <span class="preference-icon"
                ><el-icon><Fold /></el-icon
              ></span>
              <span class="preference-copy">
                <strong>自动展开菜单</strong>
                <small>进入平台时展开当前菜单层级</small>
              </span>
              <el-switch v-model="settingsStore.expandSidebarOnPlatformEnter" />
            </label>

            <label class="preference-item">
              <span class="preference-icon"
                ><el-icon><CollectionTag /></el-icon
              ></span>
              <span class="preference-copy">
                <strong>显示页面标签</strong>
                <small>顶部保留已经访问的页面</small>
              </span>
              <el-switch v-model="settingsStore.showTagsView" />
            </label>

            <label class="preference-item">
              <span class="preference-icon"
                ><el-icon><DocumentChecked /></el-icon
              ></span>
              <span class="preference-copy">
                <strong>缓存页面状态</strong>
                <small>返回页面时保留操作进度</small>
              </span>
              <el-switch v-model="settingsStore.cacheTagsView" />
            </label>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.navigation-page {
  position: relative;
  height: 100%;
  overflow: auto;
  background: #ffffff;
  color: #0f172a;
  font-family: "Inter", "PingFang SC", sans-serif;
  --navigation-card-min-height: clamp(190px, 23vh, 320px);
  --navigation-card-padding: clamp(18px, 1.25vw, 28px);
  --navigation-card-gap: clamp(14px, 1vw, 22px);
  --navigation-title-size: clamp(24px, 0.95vw, 28px);
  --navigation-card-title-size: clamp(20px, 1vw, 28px);
  --navigation-card-text-size: clamp(13px, 0.68vw, 16px);
  --navigation-card-label-size: clamp(12px, 0.58vw, 14px);
  --navigation-icon-size: clamp(42px, 2.2vw, 58px);
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.52;
  pointer-events: none;
}

.navigation-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100%;
  padding: 24px 32px 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.brand-section {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
  padding: 22px 24px;
  border: 1px solid #e7edf3;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(14, 165, 233, 0.06) 42%, rgba(255, 255, 255, 0.92)),
    rgba(255, 255, 255, 0.9);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 18px 36px -28px rgba(15, 23, 42, 0.38);
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 34%;
    height: 100%;
    background:
      linear-gradient(115deg, transparent 0 36%, rgba(255, 255, 255, 0.58) 36% 42%, transparent 42%),
      radial-gradient(circle at 72% 36%, rgba(14, 165, 233, 0.12), transparent 38%);
    pointer-events: none;
  }
}

.brand-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.brand-mark {
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(5, 150, 105, 0.18);
  background: #ffffff;
  color: #059669;
  box-shadow:
    inset 0 0 0 6px #f0fdf4,
    0 10px 24px -16px rgba(5, 150, 105, 0.7);
}

.brand-copy {
  max-width: 800px;
  min-width: 0;
}

.brand-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 24px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border-radius: 6px;
  border: 1px solid #dcfce7;
  background: #f0fdf4;
  color: #059669;
  font-size: 12px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0;
}

.meta-divider {
  width: 1px;
  height: 12px;
  background: #cbd5e1;
}

.meta-text {
  color: #64748b;
  font-size: 12px;
  line-height: 1;
  font-weight: 800;
}

.brand-copy h1 {
  margin: 8px 0 7px;
  color: #0f172a;
  font-size: var(--navigation-title-size);
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: 0;
}

.brand-copy p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
  font-weight: 500;
}

.access-note {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 12px 0 15px;
  border-radius: 8px;
  border: 1px solid rgba(5, 150, 105, 0.16);
  background: rgba(255, 255, 255, 0.84);
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 10px 24px -20px rgba(15, 23, 42, 0.45);

  .el-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #ecfdf5;
    color: #059669;
  }
}

.access-count {
  color: #0f172a;
  font-size: 22px;
  line-height: 1;
  font-weight: 900;
}

.access-copy {
  color: #64748b;
  font-size: 12px;
  line-height: 1;
  font-weight: 800;
}

.navigation-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(300px, 16vw, 380px);
  align-items: stretch;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-auto-rows: minmax(var(--navigation-card-min-height), auto);
  gap: var(--navigation-card-gap);
  width: 100%;
  min-height: 0;

  &.grid-layout-5 {
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(2, minmax(var(--navigation-card-min-height), 1fr));

    .platform-card {
      min-height: var(--navigation-card-min-height);
    }

    .platform-card:nth-child(1),
    .platform-card:nth-child(2) {
      grid-column: span 3;
    }

    .platform-card:nth-child(3),
    .platform-card:nth-child(4),
    .platform-card:nth-child(5) {
      grid-column: span 2;
    }
  }
}

.platform-card {
  position: relative;
  min-height: 190px;
  display: flex;
  flex-direction: column;
  gap: var(--navigation-card-gap);
  padding: var(--navigation-card-padding);
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.025),
    0 16px 32px -18px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--card-color) 8%, transparent), transparent 46%), #ffffff;
    opacity: 0;
    transition: opacity 0.22s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: color-mix(in srgb, var(--card-color) 26%, #f1f5f9);
    box-shadow: 0 18px 34px rgba(15, 23, 42, 0.09);

    &::before {
      opacity: 1;
    }

    .icon-box {
      color: #ffffff;
      background: var(--card-color);
      border-color: var(--card-color);
    }

    .card-foot {
      color: var(--card-color);
    }
  }
}

.preference-panel {
  min-width: 0;
  align-self: stretch;
  padding: 18px;
  border-radius: 8px;
  border: 1px solid #e7edf3;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.025),
    0 16px 32px -18px rgba(15, 23, 42, 0.18);
}

.preference-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf2f7;

  > div > span {
    color: #059669;
    font-size: 12px;
    font-weight: 800;
  }

  h2 {
    margin: 5px 0 0;
    color: #0f172a;
    font-size: 18px;
    line-height: 1.25;
    font-weight: 900;
    letter-spacing: 0;
  }
}

.local-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.preference-list {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
}

.preference-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 72px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }
}

.preference-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #dcfce7;
  background: #f0fdf4;
  color: #059669;
}

.preference-copy {
  min-width: 0;

  strong,
  small {
    display: block;
  }

  strong {
    color: #1e293b;
    font-size: 13px;
    line-height: 1.3;
    font-weight: 800;
  }

  small {
    margin-top: 5px;
    color: #94a3b8;
    font-size: 11px;
    line-height: 1.45;
    font-weight: 500;
  }
}

.card-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.icon-box {
  width: var(--navigation-icon-size);
  height: var(--navigation-icon-size);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--card-color) 14%, #f1f5f9);
  background: color-mix(in srgb, var(--card-color) 8%, #ffffff);
  color: var(--card-color);
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.platform-code {
  color: var(--card-color);
  font-size: var(--navigation-card-label-size);
  line-height: 1;
  font-weight: 900;
}

.card-body {
  position: relative;
  z-index: 1;
  flex: 1;
}

.card-summary {
  display: block;
  margin-bottom: 9px;
  color: var(--card-color);
  font-size: var(--navigation-card-label-size);
  line-height: 1;
  font-weight: 900;
}

.card-body h2 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: var(--navigation-card-title-size);
  line-height: 1.25;
  font-weight: 900;
  letter-spacing: 0;
}

.card-body p {
  margin: 0;
  color: #64748b;
  font-size: var(--navigation-card-text-size);
  line-height: 1.58;
  font-weight: 500;
}

.card-foot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 24px;
  color: #94a3b8;
  font-size: var(--navigation-card-label-size);
  line-height: 1;
  font-weight: 800;
  transition: color 0.2s ease;
}

.empty-panel {
  position: relative;
  min-height: min(520px, calc(100vh - 310px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 56px 40px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  background:
    linear-gradient(180deg, rgba(240, 253, 244, 0.54), rgba(255, 255, 255, 0.92) 44%), rgba(255, 255, 255, 0.94);
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.025),
    0 16px 32px -18px rgba(15, 23, 42, 0.18);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 24px;
    border-radius: 8px;
    border: 1px dashed rgba(148, 163, 184, 0.22);
    pointer-events: none;
  }
}

.empty-visual {
  position: relative;
  width: 126px;
  height: 126px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(5, 150, 105, 0.14);
  background: rgba(255, 255, 255, 0.52);
}

.empty-orbit-large {
  inset: 0;
}

.empty-orbit-small {
  inset: 18px;
  background: rgba(240, 253, 244, 0.72);
}

.empty-icon {
  position: relative;
  z-index: 1;
  width: 66px;
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  background: #ffffff;
  color: #059669;
  box-shadow:
    inset 0 0 0 8px #f0fdf4,
    0 18px 34px -24px rgba(5, 150, 105, 0.55);
}

.empty-copy {
  position: relative;
  z-index: 1;
  max-width: 520px;
  text-align: center;
}

.empty-kicker {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border-radius: 6px;
  border: 1px solid #dcfce7;
  background: #f0fdf4;
  color: #059669;
  font-size: 12px;
  line-height: 1;
  font-weight: 800;
}

.empty-copy h2 {
  margin: 14px 0 8px;
  color: #0f172a;
  font-size: 22px;
  line-height: 1.35;
  font-weight: 900;
  letter-spacing: 0;
}

.empty-copy p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
  font-weight: 500;
}

.empty-actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 2px;

  span {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 700;
  }
}

@media (max-width: 1400px) {
  .navigation-shell {
    padding: 24px 24px 28px;
  }

  .navigation-content {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}

@media (min-width: 1921px) {
  .navigation-page {
    --navigation-card-min-height: clamp(300px, 31vh, 440px);
    --navigation-card-padding: clamp(28px, 1.45vw, 40px);
    --navigation-card-gap: clamp(20px, 1.05vw, 28px);
    --navigation-title-size: clamp(26px, 0.95vw, 32px);
    --navigation-card-title-size: clamp(26px, 1.05vw, 34px);
    --navigation-card-text-size: clamp(15px, 0.68vw, 18px);
    --navigation-card-label-size: clamp(13px, 0.56vw, 16px);
    --navigation-icon-size: clamp(56px, 2.25vw, 72px);
  }

  .navigation-shell {
    padding: 32px 40px 40px;
  }

  .brand-section {
    margin-bottom: 28px;
    padding: 30px 34px;
  }

  .navigation-content {
    grid-template-columns: minmax(0, 1fr) clamp(360px, 16vw, 440px);
    gap: 24px;
  }

  .platform-grid {
    gap: var(--navigation-card-gap);
  }

  .preference-panel {
    padding: 24px;
  }
}

@media (max-width: 1180px) {
  .navigation-page {
    --navigation-card-min-height: 190px;
    --navigation-card-padding: 18px;
    --navigation-card-gap: 14px;
    --navigation-title-size: 24px;
    --navigation-card-title-size: 20px;
    --navigation-card-text-size: 13px;
    --navigation-card-label-size: 12px;
    --navigation-icon-size: 42px;
  }

  .navigation-shell {
    display: block;
  }

  .navigation-content {
    grid-template-columns: 1fr;
  }

  .platform-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto;
    grid-auto-rows: auto;
    flex: none;
  }

  .preference-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 14px;
  }

  .preference-item {
    border: 1px solid #edf2f7;
    border-radius: 8px;
    padding: 12px;
  }

  .platform-grid.grid-layout-5 {
    .platform-card:nth-child(1),
    .platform-card:nth-child(2),
    .platform-card:nth-child(3),
    .platform-card:nth-child(4),
    .platform-card:nth-child(5) {
      grid-column: auto;
    }
  }
}

@media (max-width: 760px) {
  .navigation-shell {
    padding: 24px 20px 30px;
  }

  .brand-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 18px;
  }

  .brand-main {
    align-items: flex-start;
    gap: 12px;
  }

  .brand-mark {
    width: 44px;
    height: 44px;
  }

  .brand-copy h1 {
    font-size: 24px;
  }

  .access-note {
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
  }

  .platform-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 12px;
  }

  .platform-card {
    min-height: 0;
    padding: 20px;
  }

  .empty-panel {
    min-height: 360px;
    padding: 42px 22px;
  }

  .empty-copy h2 {
    font-size: 20px;
  }

  .empty-actions {
    flex-direction: column;
    gap: 9px;
    text-align: center;
  }

  .preference-list {
    grid-template-columns: 1fr;
  }

  .preference-item {
    min-height: 64px;
  }
}
</style>
