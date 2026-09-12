<template>
  <aside class="tenant-sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title-bar">
        <span class="sidebar-title">空间维度</span>
        <el-tag size="small" type="info" effect="plain" round>{{ tenants.length }} 个空间</el-tag>
      </div>

      <!-- 租户类型分类筛选 -->
      <div class="tenant-type-pills">
        <button
          class="pill-btn"
          :class="{ active: tenantFilterType === 'all' }"
          @click="emit('update:filterType', 'all')"
        >
          全部 ({{ allCount }})
        </button>
        <button
          v-if="hasOrganizations"
          class="pill-btn"
          :class="{ active: tenantFilterType === 'organization' }"
          @click="emit('update:filterType', 'organization')"
        >
          组织 ({{ orgCount }})
        </button>
        <button
          v-if="hasPersonals"
          class="pill-btn"
          :class="{ active: tenantFilterType === 'personal' }"
          @click="emit('update:filterType', 'personal')"
        >
          个人 ({{ personalCount }})
        </button>
      </div>

      <!-- 租户名称过滤 -->
      <el-input
        :model-value="tenantSearchKey"
        placeholder="过滤租户..."
        size="small"
        clearable
        class="tenant-filter-input"
        @update:model-value="(val: string) => emit('update:searchKey', val)"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 租户卡片滚动列表 -->
    <div class="tenant-card-list">
      <div
        v-for="tenant in tenants"
        :key="tenant.tenant_id"
        class="tenant-card"
        :class="{ active: activeTenantId === tenant.tenant_id }"
        @click="emit('select', tenant.tenant_id)"
      >
        <div class="tenant-card-left">
          <div class="tenant-avatar" :class="tenant.tenant_type">
            <el-icon>
              <OfficeBuilding v-if="tenant.tenant_type === 'organization'" />
              <User v-else />
            </el-icon>
          </div>
          <div class="tenant-info">
            <span class="tenant-name" :title="getDisplayName(tenant.tenant_id, tenant.tenant_type)">
              {{ getDisplayName(tenant.tenant_id, tenant.tenant_type) }}
            </span>
            <span class="tenant-sub">ID: {{ tenant.tenant_id }} · {{ tenant.models?.length || 0 }} 个模型</span>
          </div>
        </div>
        <div class="tenant-badge">
          <span class="count-tag">{{ tenant.total }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { OfficeBuilding, Search, User } from "@element-plus/icons-vue"
import type { AdminSearchTenantItem } from "@/api/cmdb/resource/types/resource"
import type { TenantFilterType } from "../types"

interface TenantSidebarProps {
  tenants: AdminSearchTenantItem[]
  activeTenantId: number
  tenantFilterType: TenantFilterType
  tenantSearchKey: string
  allCount: number
  orgCount: number
  personalCount: number
  hasOrganizations: boolean
  hasPersonals: boolean
  getDisplayName: (tenantId: number, tenantType: string) => string
}

defineProps<TenantSidebarProps>()

const emit = defineEmits<{
  (e: "update:filterType", type: TenantFilterType): void
  (e: "update:searchKey", key: string): void
  (e: "select", tenantId: number): void
}>()
</script>

<style scoped lang="scss">
.tenant-sidebar {
  width: 270px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04);
  overflow: hidden;

  .sidebar-header {
    padding: 14px 14px 10px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sidebar-title-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .sidebar-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
  }

  .tenant-type-pills {
    display: flex;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 6px;
    gap: 2px;

    .pill-btn {
      flex: 1;
      border: none;
      background: transparent;
      padding: 4px 6px;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        color: #0f172a;
      }

      &.active {
        background: #ffffff;
        color: #2563eb;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
      }
    }
  }

  .tenant-filter-input {
    :deep(.el-input__wrapper) {
      border-radius: 6px;
      background: #f8fafc;
      box-shadow: 0 0 0 1px #e2e8f0 inset;
    }
  }

  .tenant-card-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tenant-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #ffffff;

    &:hover {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    &.active {
      background: #eff6ff;
      border-color: #bfdbfe;

      .tenant-name {
        color: #1d4ed8;
        font-weight: 700;
      }

      .count-tag {
        background: #2563eb;
        color: #ffffff;
      }
    }
  }

  .tenant-card-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .tenant-avatar {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    flex-shrink: 0;

    &.organization {
      background: #e0e7ff;
      color: #4338ca;
    }

    &.personal {
      background: #fef3c7;
      color: #d97706;
    }
  }

  .tenant-info {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .tenant-name {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tenant-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
  }

  .tenant-badge {
    .count-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      background: #f1f5f9;
      color: #64748b;
      transition: all 0.2s ease;
    }
  }
}
</style>
