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
  // 确认按钮相关
  confirmText?: string
}

withDefaults(defineProps<Props>(), {
  accentColor: "#3b82f6",
  layerBg: "#f8fafc",
  listWidth: "340px",
  searchPlaceholder: "请输入关键词检索...",
  total: 0,
  pageSize: 10,
  confirmText: "确认确认"
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
    <div class="studio-layout" :style="{ '--accent-color': accentColor, '--layer-bg': layerBg }">
      <div class="main-panel">
        <!-- 1. 操作层 (Action Layer) -->
        <div class="action-layer">
          <div class="search-area">
            <el-input v-model="keyword" :placeholder="searchPlaceholder" class="compact-search" clearable>
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <div class="action-tools">
              <slot name="toolbar-extra" />
              <el-button :icon="Refresh" class="refresh-tool" @click="emit('refresh')" />
            </div>
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
              view-style="padding-right: 16px; padding-bottom: 20px;"
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
                {{ confirmText }}
              </el-button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<!-- 全局样式块：处理插槽内容和第三方组件样式 -->
<style lang="scss">
.premium-resource-selector {
  $tool-h: 36px;
  $line: #e2e8f0;
  $text-main: #0f172a;
  $text-sub: #64748b;
  $radius: 10px;

  @mixin tool-base-global {
    height: $tool-h !important;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    vertical-align: top;
  }

  // 1. 分段过滤器
  .eiam-segment-filter {
    display: flex;
    height: $tool-h !important;
    align-items: stretch;
    .el-radio-button {
      height: 100% !important;
      display: flex;
    }
    .el-radio-button__inner {
      @include tool-base-global;
      width: 100%;
      line-height: 1 !important;
      padding: 0 16px !important;
      background-color: #f1f5f9;
      border: 1px solid $line;
      border-radius: 0;
      font-size: 13px;
      font-weight: 500;
      color: $text-sub;
      box-shadow: none !important;
      &:hover {
        color: var(--accent-color);
      }
    }
    .el-radio-button:first-child .el-radio-button__inner {
      border-radius: 8px 0 0 8px;
    }
    .el-radio-button:last-child .el-radio-button__inner {
      border-radius: 0 8px 8px 0;
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      background-color: #ffffff;
      color: var(--accent-color);
      border-color: $line;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
      position: relative;
      z-index: 1;
    }
  }

  // 2. 已选清单卡片
  .resource-entity-card {
    margin-bottom: 8px;
    &:last-child {
      margin-bottom: 0;
    }

    .card-content {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #ffffff;
      border: 1px solid $line;
      border-radius: 8px;
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--accent-color);
        .del-btn {
          opacity: 1;
        }
      }
    }

    .entity-info {
      flex: 1;
      min-width: 0;
      .entity-name {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: $text-main;
      }
      .entity-id {
        font-size: 11px;
        color: $text-sub;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
    }

    .del-btn {
      opacity: 0.3;
      cursor: pointer;
      color: #94a3b8;
      font-size: 14px;
      transition: all 0.2s;
      &:hover {
        color: #ef4444;
        opacity: 1;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
$tool-h: 36px;
$line: #e2e8f0;
$text-main: #0f172a;
$text-sub: #64748b;
$radius: 8px;

@mixin tool-base {
  height: $tool-h !important;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  vertical-align: top;
}

.studio-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
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
        @include tool-base;
        box-shadow: none;
        border: 1px solid $line;
        border-radius: $radius;
        background: #fff;
        &:hover,
        &.is-focus {
          border-color: var(--accent-color);
        }
      }
    }
    .action-tools {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .refresh-tool {
      @include tool-base;
      width: $tool-h !important;
      padding: 0 !important;
      background-color: #f1f5f9;
      border: 1px solid $line;
      border-radius: $radius;
      color: $text-sub;
      transition: all 0.2s;

      &:hover {
        background-color: #e2e8f0;
        color: var(--accent-color);
        border-color: var(--accent-color);
      }
      &:active {
        background-color: #cbd5e1;
      }
    }
  }

  .vertical-divider {
    width: 1px;
    height: 100%;
    background: $line;
  }

  .selection-header {
    padding: 0 20px;
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
    padding: 16px 4px 16px 20px;
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
      height: 44px;
      background: #2563eb !important;
      border-color: #2563eb !important;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      color: #fff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover:not(:disabled) {
        background: #1d4ed8 !important;
        border-color: #1d4ed8 !important;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &.is-disabled {
        background: #94a3b8 !important;
        border-color: #94a3b8 !important;
        box-shadow: none;
        opacity: 0.6;
      }
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
