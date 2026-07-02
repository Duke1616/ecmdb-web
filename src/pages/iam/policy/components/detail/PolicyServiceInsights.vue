<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import type { Policy, ServiceSummary } from "@/api/iam/policy/type"
import { getPermissionManifestApi } from "@/api/iam/permission"
import type { PermissionManifest } from "@/api/iam/permission/type"
import PolicyServiceList from "./PolicyServiceList.vue"
import PolicyActionDetail from "./PolicyActionDetail.vue"
import PolicySourceView from "./PolicySourceView.vue"

interface Props {
  policy: Policy
  services: ServiceSummary[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: "copy", text: string): void
}>()

// 治理层次与展示模式管理
const currentLevel = ref<"summary" | "service">("summary") // 当前层级
const selectedSvc = ref<any>(null) // 当前下钻的服务
const displayMode = ref<"visual" | "source">("visual") // 展示模式：摘要 vs 源代码

const manifest = ref<PermissionManifest | null>(null)

onMounted(async () => {
  try {
    const res = await getPermissionManifestApi()
    manifest.value = res.data
  } catch (err) {
    console.error("[GetPermissionManifestError]", err)
  }
})

/**
 * 通配符匹配函数 (对齐 PermissionMatrix.vue 逻辑)
 */
const matchAction = (pattern: string, code: string): boolean => {
  const regexPattern =
    "^" +
    pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".") +
    "$"
  try {
    return new RegExp(regexPattern, "i").test(code)
  } catch {
    return false
  }
}

/**
 * 核心逻辑：直接基于 policy.statement 模式匹配全量权限清单，生成可视化视图映射
 * 彻底避免了因后端匹配不准确返回空 actions 导致的页面显示空白问题
 */
const processedServices = computed(() => {
  if (!manifest.value || !props.policy || !props.policy.statement) {
    return props.services || []
  }

  // 1. 建立 code -> action元数据 查表字典
  const actionMetaMap = new Map<string, { name: string; group?: string }>()
  if (Array.isArray(manifest.value.actions)) {
    manifest.value.actions.forEach((act: any) => {
      actionMetaMap.set(act.code, { name: act.name, group: act.group })
    })
  }

  // 2. 收集策略中所有配置的 action 通配匹配模式
  const patterns = props.policy.statement.flatMap((s) => s.action || [])

  // 3. 遍历权限清单中的服务，筛选并装配出已被授权的 ServiceSummary
  return manifest.value.services
    .map((svc: any) => {
      const allActionCodes: string[] = []
      const collect = (grp: any) => {
        if (Array.isArray(grp.actions)) allActionCodes.push(...grp.actions)
        if (Array.isArray(grp.children)) grp.children.forEach((child: any) => collect(child))
      }
      ;(svc.entries || []).forEach(collect)

      const uniqueActionCodes = [...new Set(allActionCodes)]
      if (uniqueActionCodes.length === 0) return null

      // 对每个 URN，判定是否匹配策略中的任意模式
      const matchedActions = uniqueActionCodes
        .filter((code) => patterns.includes(code) || patterns.some((pat) => matchAction(pat, code)))
        .map((code) => {
          const meta = actionMetaMap.get(code)
          return {
            action: code,
            name: meta ? meta.name : code,
            effect: "Allow",
            group: meta ? meta.group : "",
            resource: "*",
            condition: "-"
          }
        })

      return {
        service_code: svc.code,
        service_name: svc.name,
        effect: "Allow",
        level: matchedActions.length === uniqueActionCodes.length ? "ALL" : "PARTIAL",
        granted_count: matchedActions.length,
        total_count: uniqueActionCodes.length,
        resource_scope: "*",
        condition: "-",
        actions: matchedActions
      }
    })
    .filter((svc: any) => svc && svc.granted_count > 0) as ServiceSummary[]
})

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
  <div class="policy-service-insights premium-card-shelf">
    <!-- 1. 深度治理面板头 -->
    <div class="insights-unified-header">
      <div class="header-left">
        <div class="indicator-mark" />
        <div class="breadcrumb-nav">
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
        <span v-if="displayMode === 'visual' && currentLevel === 'summary'" class="count-badge">
          {{ processedServices.length }}
        </span>
      </div>

      <div class="header-actions">
        <el-radio-group v-model="displayMode" size="small" class="eiam-mode-radio">
          <el-radio-button value="visual">视图映射</el-radio-button>
          <el-radio-button value="source">源代码</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 2. 治理内容实体 -->
    <div class="governance-content-pane">
      <template v-if="displayMode === 'visual'">
        <!-- 第一级：子系统治理概览 -->
        <PolicyServiceList
          v-if="currentLevel === 'summary'"
          :services="processedServices"
          @drill-down="handleSvcDrillDown"
        />

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
      <PolicySourceView v-else :policy="policy" borderless @copy="(text) => emit('copy', text)" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.policy-service-insights {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
  overflow: hidden;
}

.insights-unified-header {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px; /* 严格对齐 PremiumList 的 header padding */
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .indicator-mark {
      width: 5px;
      height: 26px;
      background: #3b82f6;
      border-radius: 999px;
    }

    .count-badge {
      min-width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e5edf5;
      padding: 0 8px;
      border-radius: 999px;
      margin-left: 8px;
    }
  }
}

.breadcrumb-nav {
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
      font-weight: 500;
      &:hover {
        color: #3b82f6;
      }
    }
    &.active {
      color: #1e293b;
    }
  }

  .divider {
    color: #cbd5e1;
    font-weight: 400;
    margin: 0 4px;
  }
}

.eiam-mode-radio {
  background: #f1f5f9;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  display: inline-flex;

  :deep(.el-radio-button__inner) {
    border-radius: 8px;
    padding: 6px 18px;
    font-size: 13px;
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
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  }
}

.governance-content-pane {
  background: #ffffff;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: hidden;
  padding-top: 16px;
  padding-bottom: 16px;
}

/* 消除子组件内部 PremiumList 的结构，防止双重边框 */
:deep(.premium-shelf) {
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
</style>
