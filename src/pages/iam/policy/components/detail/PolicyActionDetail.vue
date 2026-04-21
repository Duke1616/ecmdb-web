<script setup lang="ts">
import type { ActionDetail } from "@/api/iam/policy/type"
import PremiumList from "@/common/components/PremiumList/index.vue"

interface Props {
  actions: ActionDetail[]
  total: number
}

defineProps<Props>()

const currentPage = defineModel<number>("page")
const pageSize = defineModel<number>("pageSize")

// NOTE: 该组件为纯 UI 展示组件，分页状态可通过 defineModel 与父组件同步
</script>

<template>
  <div class="policy-action-detail">
    <PremiumList :data="actions" hide-header hide-pagination>
      <!-- 内部列头 -->
      <template #column-header>
        <div class="detail-cols header-label-font">
          <span>操作权限 (ACTION)</span>
          <span>所属分组</span>
          <span>目标资源 (RESOURCE)</span>
          <span>生效条件 (CONDITION)</span>
        </div>
      </template>

      <!-- 项模板 -->
      <template #item="{ item: row }">
        <div class="detail-grid-row">
          <!-- 1. 操作身份 -->
          <div class="cell-action">
            <div class="action-identity">
              <span class="action-name">{{ row.name }}</span>
              <code class="action-mono">{{ row.action }}</code>
            </div>
          </div>

          <!-- 2. 分组 -->
          <div class="cell-group">
            <span class="group-label">{{ row.group || "通用分组" }}</span>
          </div>

          <!-- 3. 资源 -->
          <div class="cell-scope">
            <div class="scope-fragment" :class="{ global: row.resource === '*' }">
              <code>{{ row.resource === "*" ? "所有资源" : row.resource }}</code>
            </div>
          </div>

          <!-- 4. 条件 -->
          <div class="cell-condition">
            <div class="governance-snippet" :class="{ empty: row.condition === '-' }">
              <code>{{ row.condition === "-" ? "无限制条件" : row.condition }}</code>
            </div>
          </div>
        </div>
      </template>
    </PremiumList>

    <!-- 内部分页控制器 -->
    <div v-if="total > (pageSize || 10)" class="detail-pagination-bar">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        background
        small
      />
    </div>

    <!-- 仅在无数据时显示 empty -->
    <el-empty v-if="!actions?.length" description="该级别的解析能力正在接入中..." :image-size="80" />
  </div>
</template>

<style lang="scss" scoped>
.header-label-font {
  font-size: 12px;
  font-weight: 600;
  color: #8a99ad;
  letter-spacing: 0.01em;
}

.detail-cols {
  display: grid;
  grid-template-columns: 280px 140px 1.2fr 1.5fr;
  gap: 24px;
  width: 100%;
  align-items: center;
}

.detail-grid-row {
  display: grid;
  grid-template-columns: 280px 140px 1.2fr 1.5fr;
  align-items: center;
  gap: 24px;
  min-height: 64px;
  border-radius: 8px;
  margin: 0 -24px;
  padding: 0 24px;
  transition: all 0.15s ease;

  &:hover {
    background: #f8fafc;
  }
}

.detail-pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-bottom: 8px;
}

.action-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .action-name {
    font-size: 13.5px;
    font-weight: 600;
    color: #1e293b;
  }
  .action-mono {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 11px;
    color: #94a3b8;
    letter-spacing: -0.01em;
  }
}

.group-label {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.scope-fragment {
  code {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 12px;
    color: #475569;
    padding: 2px 6px;
    background: #f1f5f9;
    border-radius: 4px;
  }
  &.global code {
    background: #eef2ff;
    color: #6366f1;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
}

.governance-snippet {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  display: inline-flex;
  min-width: 60px;

  code {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 12px;
    color: #475569;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &.empty {
    background: transparent;
    border: none;
    padding-left: 0;
    code {
      color: #94a3b8;
      font-style: italic;
      font-weight: 400;
      &::before {
        content: "•";
        margin-right: 6px;
        color: #e2e8f0;
      }
    }
  }
}
</style>
