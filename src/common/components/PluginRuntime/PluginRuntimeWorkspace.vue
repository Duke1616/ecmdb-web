<script lang="ts" setup>
import { toRef } from "vue"
import { ArrowLeft, ArrowRight, Collection, Search } from "@element-plus/icons-vue"
import type { PluginRuntimePresentation } from "@/api/cmdb/plugin/types/plugin"
import { useRuntimeSidebarResources } from "./useRuntimeSidebarResources"

const props = defineProps<{
  presentation?: PluginRuntimePresentation | null
}>()

const {
  loading,
  keyword,
  filteredResources,
  total,
  currentPage,
  sidebarCollapsed,
  sidebarEnabled,
  sidebarTitle,
  sidebarSearchPlaceholder,
  sidebarEmptyText,
  sidebarCollapsible,
  sidebarLimit,
  showPagination,
  resourceId,
  getTitle,
  getSubtitle,
  handleResourceSelect,
  toggleSidebar
} = useRuntimeSidebarResources(toRef(props, "presentation"))

const getCollapsedLabel = (title: string) => {
  const value = title.trim()
  if (!value) return "?"

  const chars = Array.from(value)
  const first = chars[0] || "?"
  const second = chars[1] || ""

  if (/[\u4e00-\u9fa5]/.test(first)) {
    return `${first}${/[\u4e00-\u9fa5]/.test(second) ? second : ""}`
  }

  return `${first}${second}`.toUpperCase()
}
</script>

<template>
  <section class="plugin-runtime-workspace">
    <section
      class="plugin-runtime-workspace__layout"
      :class="{
        'has-sidebar': sidebarEnabled,
        'is-sidebar-collapsed': sidebarEnabled && sidebarCollapsed
      }"
    >
      <aside
        v-if="sidebarEnabled"
        class="plugin-runtime-workspace__sidebar"
        :class="{ 'is-collapsed': sidebarCollapsed }"
      >
        <div class="plugin-runtime-workspace__sidebar-toolbar">
        <div v-if="!sidebarCollapsed" class="plugin-runtime-workspace__sidebar-title">
          <el-icon><Collection /></el-icon>
          <span>{{ sidebarTitle }}</span>
        </div>
        <div v-if="sidebarCollapsible" class="plugin-runtime-workspace__sidebar-actions">
          <el-button :icon="sidebarCollapsed ? ArrowRight : ArrowLeft" circle text @click="toggleSidebar" />
        </div>
      </div>

      <el-input
        v-if="!sidebarCollapsed"
        v-model="keyword"
        :placeholder="sidebarSearchPlaceholder"
        clearable
          class="plugin-runtime-workspace__sidebar-search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div v-if="!sidebarCollapsed" v-loading="loading" class="plugin-runtime-workspace__sidebar-list">
          <button
            v-for="item in filteredResources"
            :key="item.id"
            type="button"
            class="plugin-runtime-workspace__resource-item"
            :class="{ active: String(item.id) === resourceId }"
            @click="handleResourceSelect(item)"
          >
            <span class="plugin-runtime-workspace__resource-name">{{ getTitle(item) }}</span>
            <span class="plugin-runtime-workspace__resource-meta">{{ getSubtitle(item) }}</span>
          </button>

          <el-empty
            v-if="!loading && filteredResources.length === 0"
            :image-size="80"
            :description="sidebarEmptyText"
          />
        </div>

        <div v-if="showPagination" class="plugin-runtime-workspace__sidebar-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="sidebarLimit"
            :total="total"
            layout="prev, pager, next"
            small
          />
        </div>

        <div v-else class="plugin-runtime-workspace__sidebar-collapsed-bar">
          <button
            v-for="item in filteredResources"
            :key="item.id"
            type="button"
            class="plugin-runtime-workspace__collapsed-resource-dot"
            :class="{ active: String(item.id) === resourceId }"
            :title="getTitle(item)"
            @click="handleResourceSelect(item)"
          >
            <span>{{ getCollapsedLabel(getTitle(item)) }}</span>
          </button>
        </div>
      </aside>

      <main class="plugin-runtime-workspace__body">
        <slot />
      </main>
    </section>
  </section>
</template>

<style lang="scss" scoped>
.plugin-runtime-workspace {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
}

.plugin-runtime-workspace__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #0f1720;
}

.plugin-runtime-workspace__layout.has-sidebar {
  grid-template-columns: 260px minmax(0, 1fr);
}

.plugin-runtime-workspace__layout.has-sidebar.is-sidebar-collapsed {
  grid-template-columns: 80px minmax(0, 1fr);
}

.plugin-runtime-workspace__sidebar {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(180deg, rgba(15, 23, 32, 0.98), rgba(11, 18, 28, 0.98)),
    radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 55%);
  color: #d7e3f4;
}

.plugin-runtime-workspace__layout.has-sidebar .plugin-runtime-workspace__sidebar.is-collapsed {
  width: 80px;
}

.plugin-runtime-workspace__layout.has-sidebar .plugin-runtime-workspace__sidebar:not(.is-collapsed) {
  width: 260px;
}

.plugin-runtime-workspace__sidebar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 16px 14px;
}

.plugin-runtime-workspace__sidebar-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
}

.plugin-runtime-workspace__sidebar-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-runtime-workspace__sidebar-actions :deep(.el-button) {
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.72);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.1);
  color: #d7e3f4;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.plugin-runtime-workspace__sidebar-actions :deep(.el-button:hover),
.plugin-runtime-workspace__sidebar-actions :deep(.el-button:focus),
.plugin-runtime-workspace__sidebar-actions :deep(.el-button:focus-visible) {
  background: rgba(41, 55, 78, 0.92);
  color: #f8fbff;
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.22);
}

.plugin-runtime-workspace__sidebar-actions :deep(.el-button:active) {
  background: rgba(37, 99, 235, 0.22);
  color: #f8fbff;
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.32);
}

.plugin-runtime-workspace__sidebar-actions :deep(.el-button.is-circle) {
  border-radius: 10px;
}

.plugin-runtime-workspace__sidebar-actions :deep(.el-button .el-icon) {
  font-size: 14px;
}

.plugin-runtime-workspace__sidebar-search {
  padding: 0 14px 10px;
}

.plugin-runtime-workspace__sidebar-search :deep(.el-input__wrapper) {
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.76);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.16);
}

.plugin-runtime-workspace__sidebar-list {
  flex: 1;
  min-height: 0;
  height: 0;
  overflow: auto;
  padding: 0 8px 10px 10px;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.24) transparent;
}

.plugin-runtime-workspace__sidebar-list::-webkit-scrollbar,
.plugin-runtime-workspace__sidebar-collapsed-bar::-webkit-scrollbar {
  width: 6px;
}

.plugin-runtime-workspace__sidebar-list::-webkit-scrollbar-track,
.plugin-runtime-workspace__sidebar-collapsed-bar::-webkit-scrollbar-track {
  background: transparent;
}

.plugin-runtime-workspace__sidebar-list::-webkit-scrollbar-thumb,
.plugin-runtime-workspace__sidebar-collapsed-bar::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.22);
}

.plugin-runtime-workspace__sidebar-pagination {
  flex-shrink: 0;
  padding: 10px 12px 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(11, 18, 28, 0.94);
}

.plugin-runtime-workspace__sidebar-pagination :deep(.el-pagination) {
  justify-content: center;
}

.plugin-runtime-workspace__sidebar-pagination :deep(.btn-prev),
.plugin-runtime-workspace__sidebar-pagination :deep(.btn-next),
.plugin-runtime-workspace__sidebar-pagination :deep(.number) {
  color: #d7e3f4;
  background: rgba(15, 23, 42, 0.72);
}

.plugin-runtime-workspace__sidebar-pagination :deep(.is-active.number) {
  background: rgba(59, 130, 246, 0.3);
  color: #f8fbff;
}

.plugin-runtime-workspace__resource-item {
  width: 100%;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  margin-bottom: 8px;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.16s ease,
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.plugin-runtime-workspace__resource-item:hover {
  background: rgba(30, 41, 59, 0.9);
  transform: translateX(2px);
}

.plugin-runtime-workspace__resource-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.26), rgba(14, 165, 233, 0.18));
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.38);
}

.plugin-runtime-workspace__resource-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: #f8fbff;
}

.plugin-runtime-workspace__resource-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: rgba(215, 227, 244, 0.68);
}

.plugin-runtime-workspace__sidebar-collapsed-bar {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 10px 8px 14px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.24) transparent;
}

.plugin-runtime-workspace__collapsed-resource-dot {
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 15px;
  background: rgba(30, 41, 59, 0.82);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.08);
  color: #d7e3f4;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;
}

.plugin-runtime-workspace__collapsed-resource-dot:hover {
  transform: translateY(-1px);
  background: rgba(41, 55, 78, 0.96);
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.14);
}

.plugin-runtime-workspace__collapsed-resource-dot.active {
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.34), rgba(29, 78, 216, 0.28));
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.38);
  color: #f8fbff;
}

.plugin-runtime-workspace__collapsed-resource-dot span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  line-height: 1;
}

.plugin-runtime-workspace__body {
  display: flex;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  padding: 14px 16px;
  overflow: hidden;
  background: #060b12;
}

.plugin-runtime-workspace__body > :deep(*) {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 1024px) {
  .plugin-runtime-workspace__layout.has-sidebar {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .plugin-runtime-workspace__layout.has-sidebar.is-sidebar-collapsed {
    grid-template-columns: 80px minmax(0, 1fr);
  }

  .plugin-runtime-workspace__layout.has-sidebar .plugin-runtime-workspace__sidebar.is-collapsed {
    width: 80px;
  }

  .plugin-runtime-workspace__layout.has-sidebar .plugin-runtime-workspace__sidebar:not(.is-collapsed) {
    width: 220px;
  }
}
</style>
