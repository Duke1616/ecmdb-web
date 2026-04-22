<script setup lang="ts">
import { Plus, Delete } from "@element-plus/icons-vue"
import PremiumList from "@/common/components/PremiumList/index.vue"
import type { InheritanceItem } from "@/api/iam/role/type"

defineProps<{
  loading: boolean
  data: InheritanceItem[]
}>()

const emit = defineEmits<{
  add: []
  remove: [row: InheritanceItem]
  view: [row: InheritanceItem]
}>()
</script>

<template>
  <PremiumList
    title="角色继承关系"
    :data="data"
    :total="data.length"
    :loading="loading"
    :show-pagination="false"
    indicator-color="#6366f1"
    show-selection
    disabled
    empty-text="暂无关联的父角色或继承关系"
  >
    <!-- 表头定义 -->
    <template #column-header>
      <div class="inheritance-cols header-label-font">
        <span>父角色资料</span>
        <span>角色来源</span>
        <span>继承层级</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <!-- 头部操作 -->
    <template #header-actions>
      <el-button plain class="toolbar-action-btn" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>添加父角色</span>
      </el-button>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="inheritance-grid-row">
        <div class="cell-identity">
          <div class="meta-info link" @click="emit('view', row)">
            <span class="name">{{ row.name }}</span>
            <code class="code-sub">{{ row.code }}</code>
          </div>
        </div>

        <div class="cell-type">
          <div class="type-indicator" :class="row.type === 1 ? 'is-system' : 'is-custom'">
            <span class="dot" />
            <span class="label">{{ row.type === 1 ? "系统预设" : "自定义角色" }}</span>
          </div>
        </div>

        <div class="cell-level">
          <div class="level-indicator" :class="{ 'is-direct': row.is_direct }">
            {{ row.is_direct ? (row.is_immutable ? "系统继承" : "直接继承") : "间接继承" }}
          </div>
        </div>

        <div class="cell-actions">
          <el-tooltip
            :disabled="row.is_direct && !row.is_immutable"
            :content="row.is_immutable ? '该关系受系统策略保护，无法手动移除' : '间接继承的角色无法在此直接移除'"
            placement="top"
          >
            <div class="action-wrapper">
              <el-button
                type="danger"
                link
                size="small"
                class="delete-btn"
                :disabled="!row.is_direct || row.is_immutable"
                @click.stop="emit('remove', row)"
              >
                <el-icon><Delete /></el-icon>
                <span>移除继承</span>
              </el-button>
            </div>
          </el-tooltip>
        </div>
      </div>
    </template>
  </PremiumList>
</template>

<style lang="scss" scoped>
.toolbar-action-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 9px;
  border-color: #6366f1;
  background: #6366f1;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;

  :deep(.el-icon) {
    margin-right: 6px;
    font-size: 14px;
  }

  &:hover {
    border-color: #4f46e5;
    background: #4f46e5;
    color: #ffffff;
  }
}

.header-label-font {
  font-size: 12px;
  font-weight: 600;
  color: #8a99ad;
}

.inheritance-cols {
  display: grid;
  grid-template-columns: 240px 140px 1fr 120px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
  }
}

.inheritance-grid-row {
  display: grid;
  grid-template-columns: 240px 140px 1fr 120px;
  align-items: center;
  gap: 24px;
  min-height: 72px;
}

.cell-identity {
  display: flex;
  align-items: center;
  gap: 12px;

  .meta-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    &.link {
      cursor: pointer;
      &:hover .name {
        color: #3b82f6;
      }
    }
    .name {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      transition: color 0.15s ease;
    }
    .code-sub {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 11px;
      color: #94a3b8;
    }
  }
}

.type-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #cbd5e1;
    flex-shrink: 0;
  }

  &.is-system {
    color: #b45309;
    .dot {
      background: #f59e0b;
    }
  }
}

.level-indicator {
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  padding: 2px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;

  &.is-direct {
    color: #4f46e5;
    background: #f5f3ff;
    border-color: #ddd6fe;
  }
}

.cell-actions {
  display: flex;
  justify-content: center;

  .action-wrapper {
    display: inline-block;
  }

  .delete-btn {
    color: #ef4444;
    transition: all 0.2s;

    &:hover:not(.is-disabled) {
      color: #dc2626;
      opacity: 0.8;
    }

    &.is-disabled {
      color: #cbd5e1;
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}
</style>
