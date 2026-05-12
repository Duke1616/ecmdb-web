<script setup lang="ts">
import { watch } from "vue"
import { Close, Coordinate, Check } from "@element-plus/icons-vue"
import { listRolesApi } from "@/api/iam/role"
import type { Role } from "@/api/iam/role/type"
import ResourceSelectorLayout from "@/common/components/ResourceSelector/ResourceSelectorLayout.vue"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

/**
 * 角色选择器 (极简版)
 * 已将布局、搜索、分页完全委托给 ResourceSelectorLayout。
 */

const visible = defineModel<boolean>({ default: false })

interface RoleSelectProps {
  confirmLoading?: boolean
  title?: string
}

withDefaults(defineProps<RoleSelectProps>(), {
  title: "分派角色主体"
})

const emit = defineEmits<{
  confirm: [selectedRoles: Role[]]
}>()

const {
  list,
  total,
  loading,
  query,
  pagination,
  tableRef,
  selectedList,
  selectedTotal,
  fetchList,
  handleSearch,
  handlePageChange,
  handleSelectionChange,
  removeSelection,
  clearSelection,
  reset
} = useResourceSelector<Role, { keyword: string }>({
  fetchApi: listRolesApi,
  listKey: "roles",
  rowKey: (row: Role) => String(row.id),
  initialQuery: { keyword: "" }
})

watch(visible, (val) => {
  if (val) fetchList()
  else reset()
})

const handleConfirm = () => {
  if (selectedTotal.value === 0) return
  emit("confirm", [...selectedList.value])
}
</script>

<template>
  <ResourceSelectorLayout
    v-model="visible"
    v-model:keyword="query.keyword"
    v-model:current-page="pagination.currentPage"
    :title="title"
    subtitle="检索系统定义并建立主体关联"
    :header-icon="Coordinate"
    :selected-total="selectedTotal"
    :total="total"
    :page-size="pagination.pageSize"
    :confirm-loading="confirmLoading"
    search-placeholder="搜索角色名、标识码..."
    accent-color="#8b5cf6"
    layer-bg="#fbfbfe"
    @update:keyword="handleSearch"
    @page-change="handlePageChange"
    @refresh="fetchList"
    @clear="clearSelection"
    @confirm="handleConfirm"
  >
    <!-- 1. 表格内容 -->
    <template #table>
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        height="100%"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" reserve-selection />
        <el-table-column label="角色标识" min-width="180">
          <template #default="{ row }">
            <div class="role-row">
              <div class="role-icon-box">
                <el-icon><Coordinate /></el-icon>
              </div>
              <div class="role-meta">
                <span class="name">{{ row.name }}</span>
                <span class="code">#{{ row.code }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="业务职责描述" min-width="300">
          <template #default="{ row }">
            <span class="desc-text">{{ row.desc || "尚未定义职责说明" }}</span>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 2. 已选清单 -->
    <template #selected-list>
      <div v-for="item in selectedList" :key="item.id" class="entity-card">
        <div class="card-content">
          <div class="ok-mark">
            <el-icon><Check /></el-icon>
          </div>
          <div class="entity-info">
            <span class="entity-name">{{ item.name }}</span>
            <span class="entity-id">#{{ item.code }}</span>
          </div>
          <el-icon class="del-btn" @click="removeSelection(item)"><Close /></el-icon>
        </div>
      </div>
    </template>

    <!-- 3. 自定义确认按钮 -->
    <template #footer-action>
      <el-button
        type="primary"
        class="prime-action role-theme-btn"
        :disabled="selectedTotal === 0"
        :loading="confirmLoading"
        @click="handleConfirm"
      >
        完成角色授权
      </el-button>
    </template>
  </ResourceSelectorLayout>
</template>

<style lang="scss" scoped>
$accent: #8b5cf6;
$text-main: #1e293b;
$text-sub: #64748b;
$line: #e2e8f0;

.role-row {
  display: flex;
  align-items: center;
  gap: 10px;
  .role-icon-box {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: #f5f3ff;
    color: $accent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    border: 1px solid #ddd6fe;
  }
  .role-meta {
    .name {
      display: block;
      font-weight: 600;
      color: $text-main;
    }
    .code {
      font-size: 11px;
      color: $text-sub;
    }
  }
}

.desc-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.entity-card {
  margin-bottom: 8px;
  .card-content {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #ffffff;
    border: 1px solid $line;
    border-radius: 8px;
    transition: border-color 0.2s;
    &:hover {
      border-color: $accent;
      .del-btn {
        opacity: 1;
      }
    }
    .ok-mark {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #f5f3ff;
      color: $accent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
    }
    .entity-info {
      flex: 1;
      min-width: 0;
      .entity-name {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: $text-main;
      }
      .entity-id {
        font-size: 11px;
        color: $text-sub;
      }
    }
    .del-btn {
      opacity: 0;
      cursor: pointer;
      color: #94a3b8;
      font-size: 14px;
      &:hover {
        color: #ef4444;
      }
    }
  }
}

.role-theme-btn {
  width: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
}
</style>
