<script setup lang="ts">
import { Search, Plus, RefreshRight, Delete } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import type { PermissionMode } from "@/common/composables/usePermission"

type GovernanceAction = {
  capability?: string | string[]
  label?: string
  icon?: any
  mode?: PermissionMode
  disabled?: boolean
  loading?: boolean
}

withDefaults(
  defineProps<{
    /** 页面大标题 */
    title: string
    /** 页面副标题说明 */
    subtitle: string
    /** 搜索输入框提示，不传则不显示搜索框 */
    searchPlaceholder?: string
    /** 当前选中的行数组长度，用于决定显示“新增”还是“批量删除” */
    selectionCount?: number
    /** 主动作配置 (如“新增”或“完善资料”) */
    primaryAction?: GovernanceAction
    /** 次动作配置 (如“新增分组”或“同步”) */
    secondaryAction?: GovernanceAction
    /** 危险/次要动作配置 (如“批量删除”或“注销主体”) */
    dangerAction?: GovernanceAction
    /** 动作切换模式：true=选中数据时隐藏新增按钮，false=并排显示 */
    swapActions?: boolean
    /** 是否吸顶 */
    sticky?: boolean
    /** 是否详情模式 (详情模式下批量注销按钮不依赖选中数) */
    isDetail?: boolean
    /** 是否显示刷新按钮 */
    showRefresh?: boolean
    /** 是否显示返回按钮 */
    showBackButton?: boolean
  }>(),
  {
    selectionCount: 0,
    swapActions: true,
    showRefresh: true,
    showBackButton: false,
    sticky: false,
    isDetail: false
  }
)

const emit = defineEmits<{
  search: [val: string]
  refresh: []
  primaryAction: []
  secondaryAction: []
  dangerAction: []
  back: []
}>()

// 使用 defineModel 极大简化双向绑定逻辑
const keyword = defineModel<string>("keyword", { default: "" })

const handleSearch = () => {
  emit("search", keyword.value)
}
</script>

<template>
  <PageContainer>
    <ManagerHeader
      :title="title"
      :subtitle="subtitle"
      :show-back-button="showBackButton"
      :sticky="sticky"
      @refresh="emit('refresh')"
      @back="emit('back')"
    >
      <template #actions>
        <div class="eiam-governance-bar">
          <!-- 优化 2: 暴露 search 插槽，允许彻底自定义搜索区 -->
          <slot name="search">
            <div v-if="searchPlaceholder" class="search-command-inner">
              <el-icon class="search-icon"><Search /></el-icon>
              <el-input
                v-model="keyword"
                :placeholder="searchPlaceholder"
                class="command-input"
                clearable
                @keyup.enter="handleSearch"
              />
            </div>
          </slot>

          <!-- 动作组 -->
          <div class="action-group">
            <!-- 优化 3: 增加前置插槽 (例如放"导入"按钮) -->
            <slot name="actions-prefix" />

            <!-- 优化 4: 增加 swapActions 判定 -->
            <template v-if="swapActions">
              <template v-if="selectionCount > 0">
                <AuthButton
                  v-if="dangerAction"
                  type="danger"
                  class="u-gov-btn is-danger-btn"
                  :class="{ 'is-detail': isDetail }"
                  :capability="dangerAction.capability"
                  :mode="dangerAction.mode"
                  :disabled="dangerAction.disabled"
                  :loading="dangerAction.loading"
                  disable-mode
                  @click="emit('dangerAction')"
                >
                  <el-icon><component :is="dangerAction.icon || Delete" /></el-icon>
                  <span
                    >{{ dangerAction.label || "批量删除"
                    }}<template v-if="!isDetail"> ({{ selectionCount }})</template></span
                  >
                </AuthButton>
              </template>
              <template v-else>
                <AuthButton
                  v-if="secondaryAction"
                  type="primary"
                  class="u-gov-btn"
                  :class="{ 'is-detail': isDetail }"
                  :capability="secondaryAction.capability"
                  :mode="secondaryAction.mode"
                  :disabled="secondaryAction.disabled"
                  :loading="secondaryAction.loading"
                  disable-mode
                  @click="emit('secondaryAction')"
                >
                  <el-icon><component :is="secondaryAction.icon || Plus" /></el-icon>
                  <span>{{ secondaryAction.label || "次要操作" }}</span>
                </AuthButton>
                <AuthButton
                  v-if="primaryAction"
                  type="primary"
                  class="u-gov-btn"
                  :class="{ 'is-detail': isDetail }"
                  :capability="primaryAction.capability"
                  :mode="primaryAction.mode"
                  :disabled="primaryAction.disabled"
                  :loading="primaryAction.loading"
                  disable-mode
                  @click="emit('primaryAction')"
                >
                  <el-icon><component :is="primaryAction.icon || Plus" /></el-icon>
                  <span>{{ primaryAction.label || "新增数据" }}</span>
                </AuthButton>
              </template>
            </template>
            <template v-else>
              <!-- 并排显示模式: 编辑在前，删除在后 -->
              <AuthButton
                v-if="secondaryAction"
                type="primary"
                class="u-gov-btn"
                :class="{ 'is-detail': isDetail }"
                :capability="secondaryAction.capability"
                :mode="secondaryAction.mode"
                :disabled="secondaryAction.disabled"
                :loading="secondaryAction.loading"
                disable-mode
                @click="emit('secondaryAction')"
              >
                <el-icon><component :is="secondaryAction.icon || Plus" /></el-icon>
                <span>{{ secondaryAction.label || "次要操作" }}</span>
              </AuthButton>
              <AuthButton
                v-if="primaryAction"
                type="primary"
                class="u-gov-btn"
                :class="{ 'is-detail': isDetail }"
                :capability="primaryAction.capability"
                :mode="primaryAction.mode"
                :disabled="primaryAction.disabled"
                :loading="primaryAction.loading"
                disable-mode
                @click="emit('primaryAction')"
              >
                <el-icon><component :is="primaryAction.icon || Plus" /></el-icon>
                <span>{{ primaryAction.label || "新增数据" }}</span>
              </AuthButton>
              <AuthButton
                v-if="dangerAction"
                type="danger"
                class="u-gov-btn is-danger-btn"
                :class="{ 'is-detail': isDetail }"
                :capability="dangerAction.capability"
                :mode="dangerAction.mode"
                :disabled="dangerAction.disabled || (!isDetail && selectionCount === 0)"
                :loading="dangerAction.loading"
                disable-mode
                @click="emit('dangerAction')"
              >
                <el-icon><component :is="dangerAction.icon || Delete" /></el-icon>
                <span
                  >{{ dangerAction.label || "批量删除"
                  }}<template v-if="!isDetail"> ({{ selectionCount }})</template></span
                >
              </AuthButton>
            </template>

            <!-- 优化 3: 增加后置插槽 (例如放"导出"按钮) -->
            <slot name="actions-suffix" />

            <el-button
              v-if="showRefresh"
              :icon="RefreshRight"
              class="eiam-refresh-btn"
              :class="{ 'is-detail': isDetail }"
              @click="emit('refresh')"
            />
          </div>
        </div>
      </template>
    </ManagerHeader>

    <!-- 下方内容区：通常放置 DataTable 和 Dialog -->
    <div class="pro-gov-content">
      <slot />
    </div>
  </PageContainer>
</template>

<style lang="scss" scoped>
.eiam-governance-bar {
  display: flex;
  align-items: center;
  gap: 16px;

  .search-command-inner {
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0 12px;
    flex: 1;
    width: 380px;
    height: 38px;
    transition: all 0.2s;

    &:hover {
      border-color: #cbd5e1;
    }

    &:focus-within {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }

    .search-icon {
      color: #94a3b8;
      font-size: 16px;
      margin-right: 8px;
    }

    .command-input {
      width: 100%;
      :deep(.el-input__wrapper) {
        box-shadow: none !important;
        background: transparent;
        padding: 0;
        .el-input__inner {
          font-size: 13px;
          color: #1e293b;
        }
      }
    }
  }
}

.action-group {
  display: flex;
  align-items: center;
  gap: 4px;

  .u-gov-btn,
  .eiam-refresh-btn {
    height: 38px;
    padding: 0 16px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s;
    font-size: 14px;

    &.is-detail {
      height: 34px;
      padding: 0 12px;
      font-size: 14px;
    }

    &:hover {
      transform: translateY(-1px);
    }

    &.is-disabled,
    &.is-disabled:hover,
    &.is-disabled:focus,
    &:disabled,
    &:disabled:hover,
    &:disabled:focus {
      color: #a8abb2 !important;
      background: #f5f7fa !important;
      border-color: #e4e7ed !important;
      box-shadow: none !important;
      transform: none;
      opacity: 1;
      cursor: not-allowed;
    }

    &.eiam-refresh-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #64748b;
      padding: 0 10px;

      &:hover {
        color: #3b82f6;
        border-color: #3b82f6;
        background: #eff6ff;
      }
    }

    /* 强制危险操作按钮为红色 */
    &.is-danger-btn {
      background-color: #ef4444 !important;
      border-color: #ef4444 !important;
      color: #ffffff !important;

      &:hover {
        background-color: #dc2626 !important;
        border-color: #dc2626 !important;
      }

      &.is-disabled,
      &.is-disabled:hover,
      &.is-disabled:focus,
      &:disabled,
      &:disabled:hover,
      &:disabled:focus {
        color: #a8abb2 !important;
        background: #f5f7fa !important;
        border-color: #e4e7ed !important;
        opacity: 1;
      }
    }
  }
}

.pro-gov-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
