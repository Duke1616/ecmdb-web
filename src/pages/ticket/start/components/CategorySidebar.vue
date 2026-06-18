<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-title">工单模板</h2>
      <span class="total-count">{{ totalCount }} 个模板</span>
    </div>

    <div v-loading="loading" class="category-nav-container">
      <div class="category-nav">
        <div
          v-if="(recentCount || 0) > 0"
          class="category-item"
          :class="{ active: selectedCategory === 'recent' }"
          @click="selectedCategory = 'recent'"
        >
          <div class="category-icon recent-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="category-info">
            <span class="category-name">最近使用</span>
            <span class="category-count">{{ recentCount || 0 }}</span>
          </div>
        </div>

        <div
          v-if="showFavorites"
          class="category-item"
          :class="{ active: selectedCategory === 'favorites' }"
          @click="selectedCategory = 'favorites'"
        >
          <div class="category-icon star-icon">
            <el-icon><Star /></el-icon>
          </div>
          <div class="category-info">
            <span class="category-name">我的收藏</span>
            <span class="category-count">{{ favoriteCount }}</span>
          </div>
        </div>

        <div class="category-item" :class="{ active: selectedCategory === 'all' }" @click="selectedCategory = 'all'">
          <div class="category-icon">
            <el-icon><Grid /></el-icon>
          </div>
          <div class="category-info">
            <span class="category-name">全部工单</span>
            <span class="category-count">{{ totalCount }}</span>
          </div>
        </div>

        <div
          v-for="item in groups"
          :key="item.id"
          class="category-item"
          :class="{ active: selectedCategory === item.id }"
          @click="selectedCategory = item.id"
        >
          <div class="category-icon">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="category-info">
            <span class="category-name">{{ item.name }}</span>
            <span class="category-count">{{ item.total }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock, Grid, Folder, Star } from "@element-plus/icons-vue"
import type { templateGroupSummary } from "@/api/ticket/template/types/template"
import type { TemplateCategoryKey } from "../composables/useTemplateFilter"

withDefaults(
  defineProps<{
    groups: templateGroupSummary[]
    favoriteCount: number
    totalCount: number
    recentCount?: number
    showFavorites?: boolean
    loading?: boolean
  }>(),
  {
    recentCount: 0,
    showFavorites: false,
    loading: false
  }
)

const selectedCategory = defineModel<TemplateCategoryKey>("selectedCategory", {
  required: true
})
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: clamp(232px, 14vw, 268px);
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
}

.sidebar-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 14px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.sidebar-title {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
}

.total-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 24px;
  padding: 0 10px;
  color: #475569;
  background: #e2e8f0;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.category-nav-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.category-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:hover {
    background: #f8fafc;
    border-color: #bfdbfe;
  }

  &.active {
    background: #eff6ff;
    border-color: #93c5fd;
    box-shadow: 0 8px 18px rgba(14, 165, 233, 0.12);

    .category-name {
      color: #0f172a;
      font-weight: 700;
    }

    .category-icon {
      background: #dbeafe;
      color: #1d4ed8;
    }
  }
}

.category-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #f1f5f9;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.2s ease;

  &.star-icon {
    background: #fef3c7 !important;
    color: #d97706 !important;
  }

  &.recent-icon {
    background: #ecfdf5 !important;
    color: #059669 !important;
  }
}

.category-item.active .category-icon.star-icon {
  background: #fde68a !important;
  color: #b45309 !important;
}

.category-info {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 10px;
}

.category-name {
  overflow: hidden;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  flex-shrink: 0;
  min-width: 24px;
  height: 20px;
  padding: 0 8px;
  color: #9ca3af;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .category-nav-container {
    overflow-x: auto;
  }

  .category-nav {
    flex-direction: row;
  }

  .category-item {
    min-width: 164px;
  }
}
</style>
