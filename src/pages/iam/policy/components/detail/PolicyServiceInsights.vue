<script setup lang="ts">
import { ref, computed } from "vue"
import type { Policy, ServiceSummary } from "@/api/iam/policy/type"
import PolicyServiceList from "./PolicyServiceList.vue"
import PolicyActionDetail from "./PolicyActionDetail.vue"
import PolicySourceView from "./PolicySourceView.vue"

interface Props {
  policy: Policy
  services: ServiceSummary[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: "copy", text: string): void
}>()

// 治理层次与展示模式管理
const currentLevel = ref<"summary" | "service">("summary") // 当前层级
const selectedSvc = ref<any>(null) // 当前下钻的服务
const displayMode = ref<"visual" | "source">("visual") // 展示模式：摘要 vs 源代码

/**
 * 触发服务下钻
 */
const handleSvcDrillDown = (svc: any) => {
  selectedSvc.value = svc
  currentLevel.value = "service"
}

/**
 * 返回服务摘要
 */
const handleBackToSummary = () => {
  selectedSvc.value = null
  currentLevel.value = "summary"
  detailPage.value = 1 // 重置分页
}

// 详情页分页
const detailPage = ref(1)
const detailPageSize = ref(10)

const paginatedActions = computed(() => {
  if (!selectedSvc.value?.actions) return []
  const start = (detailPage.value - 1) * detailPageSize.value
  return selectedSvc.value.actions.slice(start, start + detailPageSize.value)
})
</script>

<template>
  <div class="policy-service-insights">
    <!-- 1. 深度治理导航：带模式切换 (样式对齐 PremiumList Header) -->
    <div class="insights-shelf-header">
      <div class="header-left">
        <div class="title-mark" />
        <div class="breadcrumb">
          <template v-if="displayMode === 'visual'">
            <span class="crumb-item" :class="{ link: currentLevel === 'service' }" @click="handleBackToSummary">
              策略服务明细
            </span>
            <template v-if="currentLevel === 'service'">
              <span class="divider">/</span>
              <span class="crumb-item active">{{ selectedSvc?.service_name }}</span>
            </template>
          </template>
          <template v-else>
            <span class="crumb-item active">策略源代码</span>
          </template>
        </div>
      </div>

      <div class="header-actions">
        <el-radio-group v-model="displayMode" size="small" class="eiam-mode-radio">
          <el-radio-button value="visual">视图映射</el-radio-button>
          <el-radio-button value="source">源代码</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 2. 内容层：基于 displayMode 切换 -->
    <div class="governance-content-body">
      <template v-if="displayMode === 'visual'">
        <!-- 第一级：子系统治理概览 -->
        <PolicyServiceList v-if="currentLevel === 'summary'" :services="services" @drill-down="handleSvcDrillDown" />

        <!-- 第二级：具体服务操作明细 -->
        <PolicyActionDetail
          v-else
          v-model:page="detailPage"
          v-model:page-size="detailPageSize"
          :actions="paginatedActions"
          :total="selectedSvc?.actions?.length || 0"
        />
      </template>

      <!-- 源代码模式 -->
      <PolicySourceView v-else :policy="policy" @copy="(text) => emit('copy', text)" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.policy-service-insights {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
  display: flex;
  flex-direction: column;
}

/* 消除子组件内部 PremiumList 的结构，防止双重边框与多余圆角 */
:deep(.premium-shelf) {
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

.insights-shelf-header {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .title-mark {
      width: 5px;
      height: 26px;
      background: #3b82f6;
      border-radius: 999px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 0.005em;

      .crumb-item {
        transition: all 0.2s;
        &.link {
          color: #64748b;
          cursor: pointer;
          &:hover {
            color: #3b82f6;
          }
        }
      }
      .crumb-item.active {
        color: #1e293b;
      }
      .divider {
        color: #cbd5e1;
        font-weight: 400;
        margin: 0 4px;
      }
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
  }

  .eiam-mode-radio {
    background: #f1f5f9;
    padding: 4px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    display: inline-flex;

    :deep(.el-radio-button__inner) {
      border-radius: 6px;
      padding: 6px 22px;
      font-size: 14px;
      font-weight: 500;
      background: transparent;
      border: none !important;
      color: #64748b;
      box-shadow: none !important;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        color: #3b82f6;
      }
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background: #ffffff;
      color: #3b82f6;
      font-weight: 500;
      box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.05),
        0 1px 2px rgba(0, 0, 0, 0.1) !important;
    }
  }
}

.governance-content-body {
  min-height: 400px;
}
</style>
