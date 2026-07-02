<template>
  <aside class="template-group-sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-title">模板分组</h2>
      <span class="total-count">{{ totalCount }} 个模板</span>
    </div>

    <div class="category-nav-container" v-loading="loading">
      <div class="category-nav">
        <button
          type="button"
          class="category-item"
          :class="{ active: selectedGroup === 'all' }"
          @click="selectedGroup = 'all'"
        >
          <span class="category-icon">
            <el-icon><Grid /></el-icon>
          </span>
          <span class="category-info">
            <span class="category-name">全部模板</span>
            <span class="category-meta">{{ totalCount }} 个模板</span>
          </span>
        </button>

        <div
          v-for="group in groups"
          :key="group.id"
          class="category-item"
          :class="{ active: selectedGroup === group.id }"
          @click="selectedGroup = group.id"
        >
          <span class="category-icon">
            <AppIcon :name="group.icon || 'Folder'" class="group-custom-icon" />
          </span>
          <span class="category-info">
            <span class="category-name">{{ group.name }}</span>
            <span class="category-meta">{{ group.total }} 个模板</span>
          </span>
          <span v-if="canManageGroup" class="category-actions" @click.stop>
            <button
              v-if="canEditGroup"
              type="button"
              class="category-action"
              title="编辑分组"
              @click="emit('edit-group', group)"
            >
              <el-icon><EditPen /></el-icon>
            </button>
            <button
              v-if="canDeleteGroup"
              type="button"
              class="category-action is-danger"
              title="删除分组"
              @click="emit('delete-group', group)"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Delete, EditPen, Grid } from "@element-plus/icons-vue"
import AppIcon from "@/common/components/AppIcon/index.vue"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import type { templateGroupSummary } from "@/api/ticket/template/types/template"
import type { TemplateManageGroupKey } from "../types"

withDefaults(
  defineProps<{
    groups: templateGroupSummary[]
    totalCount: number
    loading?: boolean
  }>(),
  {
    loading: false
  }
)

const selectedGroup = defineModel<TemplateManageGroupKey>("selectedGroup", {
  required: true
})
const { hasPermission } = usePermission()
const canEditGroup = computed(() => hasPermission(TICKET_CAPABILITIES.Template.EditGroup))
const canDeleteGroup = computed(() => hasPermission(TICKET_CAPABILITIES.Template.DeleteGroup))
const canManageGroup = computed(() => canEditGroup.value || canDeleteGroup.value)

const emit = defineEmits<{
  (event: "edit-group", group: templateGroupSummary): void
  (event: "delete-group", group: templateGroupSummary): void
}>()
</script>

<style scoped lang="scss">
.template-group-sidebar {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: clamp(216px, 13vw, 248px);
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
}

.sidebar-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 49px;
  min-height: 49px;
  padding: 0 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.sidebar-title {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
}

.total-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 22px;
  padding: 0 9px;
  color: #475569;
  background: #e2e8f0;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.category-nav-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.category-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-item {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  min-height: 58px;
  padding: 9px 12px;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
  text-align: left;

  &::before {
    position: absolute;
    left: -1px;
    width: 4px;
    height: 30px;
    content: "";
    background: transparent;
    border-radius: 0 999px 999px 0;
    transition: background 0.2s ease;
  }

  &:hover {
    background: #f8fafc;
    border-color: #bfdbfe;
  }

  &.active {
    background: #eff6ff;
    border-color: #93c5fd;
    box-shadow: none;

    &::before {
      background: #0ea5e9;
    }

    .category-name {
      color: #0f172a;
      font-weight: 700;
    }

    .category-icon {
      background: #dbeafe;
      color: #1d4ed8;
    }
  }
}

.category-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 9px;
  color: #64748b;
  transition: all 0.2s ease;
}

.group-custom-icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.category-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
  gap: 3px;
}

.category-actions {
  position: absolute;
  right: 12px;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.category-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    color: #2563eb;
    background: #eff6ff;
  }

  &.is-danger {
    color: #ef4444;

    &:hover {
      color: #dc2626;
      background: #fef2f2;
    }
  }
}

.category-item:hover {
  .category-actions {
    opacity: 1;
  }
}

.category-name {
  overflow: hidden;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-meta {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  transition: opacity 0.2s ease;
}

.category-item.active .category-meta {
  color: #0369a1;
}

@media (max-width: 768px) {
  .template-group-sidebar {
    width: 100%;
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .category-nav-container {
    overflow-x: auto;
  }

  .category-nav {
    flex-direction: row;
  }

  .category-item {
    flex: 0 0 auto;
    min-width: 164px;
  }
}
</style>
