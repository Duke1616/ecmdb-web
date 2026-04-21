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
    <!-- 1. 深度治理导航：带模式切换 -->
    <div class="governance-nav-minimal">
      <div class="breadcrumb">
        <template v-if="displayMode === 'visual'">
          <span class="crumb-item">摘要</span>
          <span class="divider">/</span>
          <span class="crumb-item" :class="{ link: currentLevel === 'service' }" @click="handleBackToSummary">
            策略内容
          </span>
          <template v-if="currentLevel === 'service'">
            <span class="divider">/</span>
            <span class="crumb-item active">{{ selectedSvc?.service_name }}</span>
          </template>
        </template>
        <template v-else>
          <span class="crumb-item active">源代码</span>
        </template>
      </div>

      <div class="mode-switcher-wrapper">
        <el-radio-group v-model="displayMode" size="small" class="eiam-mode-radio">
          <el-radio-button value="visual">摘要</el-radio-button>
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
.governance-nav-minimal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0 12px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 12px;

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    .crumb-item {
      transition: all 0.2s;
      &.link {
        cursor: pointer;
        &:hover {
          color: #3b82f6;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
      }
    }
    .crumb-item.active {
      font-weight: 600;
      color: #0f172a;
    }
    .divider {
      color: #cbd5e1;
    }
  }

  .mode-switcher-wrapper {
    display: flex;
    align-items: center;
  }

  .eiam-mode-radio {
    background: #f1f5f9;
    padding: 3px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    display: inline-flex;

    :deep(.el-radio-button__inner) {
      border-radius: 4px;
      padding: 6px 16px;
      font-size: 12px;
      font-weight: 500;
      background: transparent;
      border: none !important;
      color: #64748b;
      box-shadow: none !important;
      transition: all 0.2s;
      &:hover {
        color: #0f172a;
      }
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background: #ffffff;
      color: #3b82f6;
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08) !important;
    }
  }
}

.governance-content-body {
  min-height: 400px;
}
</style>
