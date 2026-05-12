<script setup lang="ts">
import { Search, Refresh, Delete } from "@element-plus/icons-vue"
import { FormDialog } from "@@/components/Dialogs"

/**
 * 资源选择器通用布局组件 (增强版)
 * 封装了：三段式布局、1px 轴线对齐、滚动条优化、响应式结构、内置分页逻辑
 */

interface Props {
  title: string
  subtitle?: string
  headerIcon?: any
  selectedTotal: number
  confirmLoading?: boolean
  // 分页相关
  total?: number
  pageSize?: number
  // 主题配置
  accentColor?: string
  layerBg?: string
  // 宽度配置
  listWidth?: string
  // 搜索相关
  searchPlaceholder?: string
}

withDefaults(defineProps<Props>(), {
  accentColor: "#3b82f6",
  layerBg: "#f8fafc",
  listWidth: "340px",
  searchPlaceholder: "请输入关键词检索...",
  total: 0,
  pageSize: 10
})

const visible = defineModel<boolean>({ default: false })
const keyword = defineModel<string>("keyword")
const currentPage = defineModel<number>("currentPage", { default: 1 })

const emit = defineEmits<{
  refresh: []
  clear: []
  confirm: []
  pageChange: [page: number]
}>()
</script>

<template>
  <FormDialog
    v-model="visible"
    :title="title"
    :subtitle="subtitle"
    width="1160px"
    top="4vh"
    :header-icon="headerIcon"
    :show-footer="false"
    :full-height="true"
    class="premium-resource-selector"
  >
    <div class="studio-layout" :style="{ '--accent': accentColor, '--layer-bg': layerBg }">
      <div class="main-panel">
        <!-- 1. 操作层 (Action Layer) -->
        <div class="action-layer">
          <div class="search-area">
            <el-input v-model="keyword" :placeholder="searchPlaceholder" class="compact-search" clearable>
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button :icon="Refresh" circle class="refresh-tool" @click="emit('refresh')" />
          </div>

          <div class="vertical-divider" />

          <div class="selection-header" :style="{ width: listWidth }">
            <div class="title-meta">
              <slot name="selection-title">
                <span class="label">已选择</span>
              </slot>
              <span class="count-badge">{{ selectedTotal }}</span>
            </div>
            <el-button v-if="selectedTotal > 0" :icon="Delete" link class="clear-tool" @click="emit('clear')" />
          </div>
        </div>

        <!-- 2. 内容层 (Body Layer) -->
        <div class="studio-body">
          <div class="table-content">
            <slot name="table" />
          </div>

          <div class="selection-list-area" :style="{ width: listWidth }">
            <el-scrollbar
              class="selected-scroller"
              wrap-style="overflow-x: hidden;"
              view-style="padding-right: 12px; padding-bottom: 20px;"
            >
              <slot name="selected-list" />

              <div v-if="selectedTotal === 0" class="empty-placeholder">
                <slot name="empty-state">
                  <el-icon class="icon"><Search /></el-icon>
                  <p>请从左侧选择主体</p>
                </slot>
              </div>
            </el-scrollbar>
          </div>
        </div>

        <!-- 3. 底部层 (Bottom Layer) - 现在内置了分页 -->
        <div class="studio-bottom">
          <div class="pagination-area">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              background
              small
              layout="total, prev, pager, next"
              :total="total"
              @current-change="(val: number) => emit('pageChange', val)"
            />
          </div>
          <div class="vertical-divider" />
          <div class="submit-area" :style="{ width: listWidth }">
            <slot name="footer-action">
              <el-button
                type="primary"
                class="prime-action"
                :disabled="selectedTotal === 0"
                :loading="confirmLoading"
                @click="emit('confirm')"
              >
                完成确认
              </el-button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<style lang="scss" scoped>
$line: #e2e8f0;
$text-main: #0f172a;
$text-sub: #64748b;

.studio-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
  --accent-color: var(--accent);
  --bg-color: var(--layer-bg);
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
}

.action-layer {
  height: 64px;
  display: flex;
  align-items: center;
  background: var(--bg-color);
  border-bottom: 1px solid $line;

  .search-area {
    flex: 1;
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 12px;

    .compact-search {
      flex: 1;
      :deep(.el-input__wrapper) {
        box-shadow: none;
        border: 1px solid $line;
        border-radius: 6px;
        background: #fff;
        height: 36px;
        &:hover,
        &.is-focus {
          border-color: var(--accent-color);
        }
      }
    }
    .refresh-tool {
      color: $text-sub;
      border-color: $line;
      &:hover {
        color: var(--accent-color);
        border-color: var(--accent-color);
      }
    }
  }

  .vertical-divider {
    width: 1px;
    height: 100%;
    background: $line;
  }

  .selection-header {
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;

    .title-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      .label {
        font-size: 14px;
        font-weight: 700;
        color: $text-main;
      }
      .count-badge {
        background: var(--accent-color);
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 10px;
      }
    }
    .clear-tool {
      font-size: 12px;
      color: $text-sub;
      &:hover {
        color: #ef4444;
      }
    }
  }
}

.studio-body {
  flex: 1;
  display: flex;
  height: 0;

  .table-content {
    flex: 1;
    border-left: 1px solid $line;
    border-right: 1px solid $line;
    overflow: hidden;
    background: #fff;
  }
  .selection-list-area {
    background: var(--bg-color);
    padding: 16px 4px 16px 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.studio-bottom {
  height: 72px;
  display: flex;
  align-items: center;
  border-top: 1px solid $line;
  background: #ffffff;

  .pagination-area {
    flex: 1;
    padding: 0 24px;
    display: flex;
    justify-content: flex-end;
  }
  .vertical-divider {
    width: 1px;
    height: 100%;
    background: $line;
  }
  .submit-area {
    padding: 0 24px;
    box-sizing: border-box;
    .prime-action {
      width: 100%;
      height: 42px;
      border-radius: 8px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

.empty-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.4;
  padding-top: 40px;
  .icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
  p {
    font-size: 12px;
  }
}

:deep(.el-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #fcfdfe;
  font-size: 13px;
  border-top: none;
  th.el-table__cell {
    font-weight: 700;
    color: $text-sub;
    font-size: 11px;
  }
  &::before,
  &::after {
    display: none;
  }
}
</style>
