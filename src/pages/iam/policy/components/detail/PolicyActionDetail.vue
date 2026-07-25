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

/**
 * 格式化资源显示 (本地化)
 */
const formatResource = (res: string) => {
  if (res === "*" || (res || "").toUpperCase() === "ALL") return "所有资源"
  if ((res || "").toUpperCase() === "SPECIFIC") return "特定资源"
  return res
}

/**
 * 格式化效力显示
 */
const formatEffect = (effect: string) => {
  const e = (effect || "").toUpperCase()
  if (e === "ALLOW") return "允许"
  if (e === "DENY") return "拒绝"
  if (e === "MIXED") return "允许/拒绝"
  return e
}
</script>

<template>
  <div class="policy-action-detail">
    <PremiumList :data="actions" hide-header hide-pagination show-selection disabled indicator-color="#3b82f6">
      <!-- 内部列头 -->
      <template #column-header>
        <div class="detail-cols header-label-font">
          <span>操作权限 (ACTION)</span>
          <span>所属分组</span>
          <span>效力</span>
          <span>目标资源 (RESOURCE)</span>
          <span>策略约束</span>
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

          <!-- 3. 效力 -->
          <div class="cell-effect">
            <span class="effect-tag" :class="row.effect?.toLowerCase()">
              {{ formatEffect(row.effect) }}
            </span>
          </div>

          <!-- 3. 资源 -->
          <div class="cell-scope">
            <div class="scope-fragment" :class="{ global: row.resource === '*' }">
              <code>{{ formatResource(row.resource) }}</code>
            </div>
          </div>

          <!-- 4. 生效条件与数据访问范围 -->
          <div class="constraint-stack">
            <div class="constraint-row">
              <span class="constraint-label">条件</span>
              <span class="constraint-value" :class="{ empty: row.condition === '-' }">
                {{ row.condition === "-" ? "无" : row.condition }}
              </span>
            </div>
            <div class="constraint-row">
              <span class="constraint-label scope">范围</span>
              <span class="constraint-value" :class="{ empty: !row.access_scope || row.access_scope === '-' }">
                {{ !row.access_scope || row.access_scope === "-" ? "全部数据" : row.access_scope }}
              </span>
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
  grid-template-columns: 240px 110px 70px minmax(120px, 0.8fr) minmax(260px, 2fr);
  gap: 24px;
  width: 100%;
  align-items: center;
}

.detail-grid-row {
  display: grid;
  grid-template-columns: 240px 110px 70px minmax(120px, 0.8fr) minmax(260px, 2fr);
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
  padding-right: 24px;
}

.action-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .action-name {
    font-size: 13px;
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

.effect-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.01em;

  &.allow {
    background: #f0fdf4;
    color: #16a34a;
  }
  &.deny {
    background: #fef2f2;
    color: #dc2626;
  }
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

.constraint-stack {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.constraint-row {
  min-width: 0;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.constraint-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;

  &.scope {
    color: #2563eb;
  }
}

.constraint-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  font-size: 12px;

  &.empty {
    color: #94a3b8;
  }
}
</style>
