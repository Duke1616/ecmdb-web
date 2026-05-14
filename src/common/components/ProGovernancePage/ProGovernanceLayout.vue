<script setup lang="ts">
import { Search, Plus, RefreshRight, Delete } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"

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
    /** 新增按钮配置 */
    addConfig?: { capability?: string | string[]; label?: string; icon?: any }
    /** 批量注销按钮配置 */
    batchDeleteConfig?: { capability?: string | string[]; label?: string; icon?: any }
    /** 动作切换模式：true=选中数据时隐藏新增按钮，false=并排显示 */
    swapActions?: boolean
  }>(),
  {
    selectionCount: 0,
    swapActions: true
  }
)

const emit = defineEmits<{
  search: [val: string]
  refresh: []
  add: []
  batchDelete: []
}>()

// 使用 defineModel 极大简化双向绑定逻辑
const keyword = defineModel<string>("keyword", { default: "" })

const handleSearch = () => {
  emit("search", keyword.value)
}
</script>

<template>
  <PageContainer>
    <ManagerHeader :title="title" :subtitle="subtitle" @refresh="emit('refresh')">
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
                  v-if="batchDeleteConfig"
                  class="u-gov-btn is-danger is-large"
                  :capability="batchDeleteConfig.capability"
                  disableMode
                  @click="emit('batchDelete')"
                >
                  <el-icon><component :is="batchDeleteConfig.icon || Delete" /></el-icon>
                  <span>{{ batchDeleteConfig.label || "批量删除" }} ({{ selectionCount }})</span>
                </AuthButton>
              </template>
              <template v-else>
                <AuthButton
                  v-if="addConfig"
                  class="u-gov-btn is-large"
                  :capability="addConfig.capability"
                  disableMode
                  @click="emit('add')"
                >
                  <el-icon><component :is="addConfig.icon || Plus" /></el-icon>
                  <span>{{ addConfig.label || "新增数据" }}</span>
                </AuthButton>
              </template>
            </template>
            <template v-else>
              <!-- 并排显示模式 -->
              <AuthButton
                v-if="batchDeleteConfig"
                class="u-gov-btn is-danger is-large"
                :capability="batchDeleteConfig.capability"
                :disabled="selectionCount === 0"
                disableMode
                @click="emit('batchDelete')"
              >
                <el-icon><component :is="batchDeleteConfig.icon || Delete" /></el-icon>
                <span>{{ batchDeleteConfig.label || "批量删除" }} ({{ selectionCount }})</span>
              </AuthButton>
              <AuthButton
                v-if="addConfig"
                class="u-gov-btn is-large"
                :capability="addConfig.capability"
                disableMode
                @click="emit('add')"
              >
                <el-icon><component :is="addConfig.icon || Plus" /></el-icon>
                <span>{{ addConfig.label || "新增数据" }}</span>
              </AuthButton>
            </template>

            <!-- 优化 3: 增加后置插槽 (例如放"导出"按钮) -->
            <slot name="actions-suffix" />

            <el-button :icon="RefreshRight" class="eiam-refresh-btn" @click="emit('refresh')" />
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
  width: 100%;

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
  gap: 12px;
}

.pro-gov-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
