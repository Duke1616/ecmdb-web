<template>
  <div class="app-container">
    <!-- 空状态优化设计 -->
    <div v-if="empty === true" class="empty-state">
      <el-empty :image-size="160" description="暂无模板数据">
        <template #image>
          <div class="empty-icon" style="display: flex; justify-content: center">
            <svg viewBox="0 0 64 64" width="64" height="64">
              <circle cx="32" cy="32" r="20" fill="#f0f2f5" stroke="#d9d9d9" stroke-width="2" />
              <path d="M32 24v16M24 32h16" stroke="#bfbfbf" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
        </template>
        <template #default>
          <div style="margin-top: 16px">
            <el-button type="primary" @click="refreshData">刷新数据</el-button>
          </div>
        </template>
      </el-empty>
    </div>

    <!-- 重新设计为左右布局，带侧边栏导航 -->
    <div v-if="empty === false" class="main-layout">
      <!-- 左侧边栏 -->
      <CategorySidebar
        v-model:selectedCategory="selectedCategory"
        :templateCombinations="templateCombinations"
        :favoriteCount="favoriteIds.length"
        :totalCount="getTotalTemplateCount()"
      />

      <!-- 右侧内容区域 -->
      <div class="content-area">
        <div class="content-header">
          <div class="header-left">
            <h3 class="content-title">
              {{ getSelectedCategoryName() }}
            </h3>
            <p class="content-subtitle">
              {{ selectedCategory === "favorites" ? "快速启动您常用的工单" : "选择配置好的模板快速创建工单" }}
            </p>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchQuery"
              placeholder="搜索工单名称..."
              :prefix-icon="Search"
              clearable
              class="search-input"
            />
            <el-button
              :icon="RefreshRight"
              circle
              @click="refreshData"
              class="refresh-button"
              :class="{ 'is-loading': loading }"
              title="刷新数据"
            />
          </div>
        </div>

        <!-- 添加调试信息和修复数据显示逻辑 -->
        <div class="templates-container">
          <!-- 调试信息 -->
          <div v-if="debugMode" class="debug-info">
            <p>模板组合数量: {{ templateCombinations.length }}</p>
            <p>选中分类: {{ selectedCategory }}</p>
            <p>过滤后模板数量: {{ filteredTemplates.length }}</p>
          </div>

          <!-- 当选择"全部工单"且没有搜索时显示分组模板 -->
          <div v-if="selectedCategory === 'all' && !searchQuery" class="grouped-templates">
            <div v-for="category in templateCombinations" :key="category.id" class="template-group">
              <div class="group-header" v-if="category.templates && category.templates.length > 0">
                <div class="group-title">
                  <el-icon class="group-icon"><Folder /></el-icon>
                  <span>{{ category.name }}</span>
                  <span class="group-count">({{ category.templates.length }})</span>
                </div>
              </div>
              <div class="templates-grid" v-if="category.templates && category.templates.length > 0">
                <TemplateCard
                  v-for="tpl in category.templates"
                  :key="tpl.id"
                  :template="tpl"
                  :is-favorite="favoriteIds.includes(tpl.id)"
                  @click="handleDetail(tpl.id)"
                  @toggle-favorite="toggleFavorite"
                />
              </div>
            </div>
          </div>

          <!-- 无搜索结果或收藏为空 -->
          <div v-else-if="filteredTemplates.length === 0" class="empty-search">
            <el-empty
              :description="
                selectedCategory === 'favorites' && !searchQuery ? '您还未收藏任何模板' : '没有找到匹配的工单模板'
              "
              :image-size="120"
            >
              <template #image>
                <div class="empty-icon" style="display: flex; justify-content: center">
                  <svg viewBox="0 0 64 64" width="48" height="48">
                    <circle cx="32" cy="32" r="20" fill="#f0f2f5" stroke="#d9d9d9" stroke-width="2" />
                    <path d="M32 24v16M24 32h16" stroke="#bfbfbf" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </div>
              </template>
            </el-empty>
          </div>

          <!-- 显示检索后的平铺列表或单个分类的模板 -->
          <div v-else class="templates-grid">
            <TemplateCard
              v-for="tpl in filteredTemplates"
              :key="tpl.id"
              :template="tpl"
              :is-favorite="favoriteIds.includes(tpl.id)"
              @click="handleDetail(tpl.id)"
              @toggle-favorite="toggleFavorite"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 抽取独立的创建工单弹窗组件（利用 defineModel 维持状态单向可控） -->
    <CreateOrderDialog v-model:visible="dialogVisible" :template-id="currentTemplateId" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { Folder, Search, RefreshRight } from "@element-plus/icons-vue"
import TemplateCard from "./components/TemplateCard.vue"
import CategorySidebar from "./components/CategorySidebar.vue"
import CreateOrderDialog from "./components/CreateOrderDialog.vue"
import { useTemplateData } from "./composables/useTemplateData"
import { useTemplateFilter } from "./composables/useTemplateFilter"

const debugMode = false // 设置为 true 可以看到调试信息

const {
  templateCombinations,
  favoriteTemplates,
  favoriteIds,
  empty,
  loading,
  toggleFavorite,
  getTotalTemplateCount,
  refreshData
} = useTemplateData()

const { selectedCategory, searchQuery, getSelectedCategoryName, filteredTemplates } = useTemplateFilter(
  templateCombinations,
  favoriteTemplates
)

watch(
  filteredTemplates,
  (val) => {
    console.log("[DIAGNOSTIC] filteredTemplates changed:", val)
  },
  { immediate: true }
)

const dialogVisible = ref(false)
const currentTemplateId = ref<number | null>(null)

const handleDetail = (id: number) => {
  currentTemplateId.value = id
  dialogVisible.value = true
}
</script>

<style lang="scss" scoped>
.app-container {
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

/* Updated content area with scrollable container */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
  max-height: calc(100vh - 4rem);

  @media (max-width: 768px) {
    height: auto;
    max-height: none;
  }

  @media (min-width: 1280px) and (max-width: 1440px) {
    height: calc(100vh - 3rem);
    max-height: calc(100vh - 3rem);
  }
}

.content-header {
  padding: calc(0.8rem + 0.2vw) calc(0.8rem + 0.2vw) 0;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: calc(0.6rem + 0.1vw) calc(0.6rem + 0.1vw) 0;
  }
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 320px;

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 12px;
  }
}

.refresh-button {
  flex-shrink: 0;
  border-color: #e2e8f0;
  color: #64748b;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    color: #3b82f6;
    border-color: #3b82f6;
    background: #eff6ff;
    transform: rotate(30deg);
  }

  &.is-loading {
    color: #3b82f6;
    border-color: #3b82f6;
    background: #eff6ff;
    animation: rotate-spin 1s linear infinite;
  }
}

@keyframes rotate-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:deep(.search-input) {
  .el-input__wrapper {
    border-radius: 8px;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.05),
      0 0 0 1px #e2e8f0 inset;
    padding: 2px 12px;
    background-color: #f8fafc;
    transition: all 0.2s ease;

    &.is-focus {
      box-shadow:
        0 0 0 1px #3b82f6 inset,
        0 4px 6px -1px rgba(59, 130, 246, 0.1);
      background-color: #ffffff;
    }
  }
}

.templates-container {
  flex: 1;
  overflow-y: auto;
  padding: calc(0.8rem + 0.2vw) calc(0.8rem + 0.2vw) calc(0.5rem + 0.1vw);
  scroll-behavior: smooth;

  @media (max-width: 768px) {
    padding: calc(0.6rem + 0.1vw) calc(0.6rem + 0.1vw) calc(1.2rem + 0.3vw);
    overflow-y: visible;
  }
}

/* Added styles for grouped templates display */
.grouped-templates {
  display: flex;
  flex-direction: column;
  gap: calc(1.2rem + 0.3vw);
  margin-bottom: calc(0.6rem + 0.1vw);
}

.template-group {
  .group-header {
    margin-bottom: calc(0.6rem + 0.1vw);
    padding-bottom: calc(0.5rem + 0.1vw);
    border-bottom: 2px solid #f1f5f9;
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: calc(0.3rem + 0.1vw);
    font-size: calc(0.9rem + 0.1vw);
    font-weight: 600;
    color: #1e293b;

    .group-icon {
      color: #3b82f6;
      font-size: calc(1rem + 0.1vw);
    }

    .group-count {
      font-size: calc(0.7rem + 0.1vw);
      color: #64748b;
      font-weight: 400;
    }
  }
}

/* 修复主布局在移动端的显示 */
.main-layout {
  display: flex;
  gap: 0;
  background: white;
  border-radius: calc(0.8rem + 0.2vw);
  box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    border-radius: calc(0.6rem + 0.1vw);
  }
}

/* 优化网格布局尺寸 */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(12rem + 2vw), 1fr));
  gap: calc(0.8rem + 0.2vw);
  margin-bottom: calc(0.6rem + 0.1vw);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: calc(0.6rem + 0.1vw);
    margin-bottom: calc(0.3rem + 0.05vw);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(calc(14rem + 2.5vw), 1fr));
  }

  @media (min-width: 1280px) and (max-width: 1440px) {
    grid-template-columns: repeat(auto-fill, minmax(calc(12rem + 2vw), 1fr));
    gap: calc(0.6rem + 0.1vw);
  }
}
</style>
