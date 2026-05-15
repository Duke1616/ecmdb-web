<script setup lang="ts">
import { toRef } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
import PremiumList from "@/common/components/PremiumList/index.vue"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import { formatTimestamp } from "@@/utils/day"
import { usePolicyAssignments } from "../../composables/usePolicyAssignments"

interface Props {
  policyCode: string
  canAdd?: boolean
  canDetach?: boolean
  canBatchDetach?: boolean
  selectable?: () => boolean
}

const props = withDefaults(defineProps<Props>(), {
  canAdd: true,
  canDetach: true,
  canBatchDetach: true,
  selectable: () => true
})

const emit = defineEmits<{
  (e: "add"): void
}>()

const { hasPermission } = usePermission()

// 1. 集成授权管理能力
const {
  list,
  total,
  loading,
  pagination,
  selectedRows,
  handlePageChange,
  handleSearch,
  refresh,
  handleSubjectClick,
  handleRemove,
  handleBatchRemove
} = usePolicyAssignments(toRef(props, "policyCode"), {
  canDetach: () => props.canDetach,
  canBatchDetach: () => props.canBatchDetach
})

// 暴露方法给父组件，用于刷新
defineExpose({
  fetchAssignments: refresh
})
</script>

<template>
  <div class="policy-assignment-table">
    <PremiumList
      v-model:selection="selectedRows"
      :data="list"
      :total="total"
      :loading="loading"
      :current-page="pagination.currentPage"
      :page-size="pagination.pageSize"
      title="授权关系治理"
      search-placeholder="搜索关联的主体标识、名称或备注..."
      indicator-color="#3b82f6"
      show-selection
      row-key="id"
      :selectable="selectable"
      :table-props="!selectable() ? { class: 'selection-disabled' } : {}"
      @page-change="handlePageChange"
      @search="handleSearch"
    >
      <!-- 表头定义 -->
      <template #column-header>
        <div class="assign-cols u-gov-label">
          <span>授权主体</span>
          <span>资源范围</span>
          <span>备注说明</span>
          <span class="align-center">授权时间</span>
          <span class="align-center">操作</span>
        </div>
      </template>

      <!-- 头部操作 -->
      <template #header-actions>
        <el-button plain class="u-gov-btn" :disabled="!canAdd" @click="emit('add')">
          <el-icon><Plus /></el-icon>
          <span>新增授权主体</span>
        </el-button>
      </template>

      <!-- 批量操作 -->
      <template #batch-actions>
        <el-button
          type="danger"
          plain
          size="small"
          :disabled="!canBatchDetach || selectedRows.length === 0"
          @click="handleBatchRemove"
        >
          <el-icon><Delete /></el-icon>
          <span>批量移除</span>
        </el-button>
      </template>

      <!-- 列表项内容 -->
      <template #item="{ item: row }">
        <div class="assign-grid-row">
          <div class="cell-subject">
            <div class="dual-line-info">
              <template v-if="row.sub_type === 'user'">
                <el-link
                  v-if="hasPermission(IAM_CAPABILITIES.User.View)"
                  type="primary"
                  :underline="false"
                  class="main-title"
                  @click="handleSubjectClick(row)"
                >
                  {{ row.subject_name || row.subject }}
                </el-link>
                <span v-else class="main-title-static">{{ row.subject_name || row.subject }}</span>
              </template>
              <template v-else>
                <el-link
                  v-if="hasPermission(IAM_CAPABILITIES.Role.View)"
                  type="primary"
                  :underline="false"
                  class="main-title"
                  @click="handleSubjectClick(row)"
                >
                  {{ row.subject_name || row.subject }}
                </el-link>
                <span v-else class="main-title-static">{{ row.subject_name || row.subject }}</span>
              </template>
              <div class="sub-detail">
                <span class="type-text">{{ row.sub_type === "user" ? "IAM 用户" : "IAM 角色" }}</span>
              </div>
            </div>
          </div>

          <div class="cell-scope">
            <div class="scope-tag" :class="{ global: row.scope === '*' }">
              <code>{{ row.scope === "*" ? "Global" : row.scope || "-" }}</code>
            </div>
          </div>

          <div class="cell-desc">
            <el-tooltip
              :content="row.note || '该授权项允许主体在指定资源范围内执行预定义的策略动作。'"
              placement="top"
              :show-after="500"
            >
              <span class="desc-text">{{ row.note || "该授权项允许主体在指定资源范围内执行预定义的策略动作。" }}</span>
            </el-tooltip>
          </div>

          <div class="cell-time">
            <div class="time-item">
              <span>{{ formatTimestamp(row.ctime) || "-" }}</span>
            </div>
          </div>

          <div class="cell-actions">
            <el-button
              type="danger"
              link
              size="small"
              class="delete-btn"
              :disabled="!canDetach"
              @click="handleRemove(row)"
            >
              <el-icon><Delete /></el-icon>
              <span>移除</span>
            </el-button>
          </div>
        </div>
      </template>
    </PremiumList>
  </div>
</template>

<style lang="scss" scoped>
.assign-cols {
  display: grid;
  grid-template-columns: 240px 140px 1fr 150px 90px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
  }
}

/* NOTE: 无操作权限时，禁用表头全选 Checkbox */
:deep(.selection-disabled) {
  .el-table__header-wrapper .el-checkbox {
    pointer-events: none;
    opacity: 0.4;
  }
}

.assign-grid-row {
  display: grid;
  grid-template-columns: 240px 140px 1fr 150px 90px;
  align-items: center;
  gap: 24px;
  min-height: 80px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: #f8fafc;
  }
}

.cell-subject {
  .dual-line-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    gap: 4px;
    min-width: 0;

    .main-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &:hover {
        color: #3b82f6;
      }
    }
    .main-title-static {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: default;
    }
    .sub-detail {
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;

      .type-text {
        color: #94a3b8;
        font-weight: 500;
      }
    }
  }
}

.cell-scope {
  .scope-tag {
    code {
      font-size: 11px;
      color: #475569;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    &.global code {
      background: #eef2ff;
      color: #6366f1;
      font-weight: 600;
    }
  }
}

.delete-btn {
  transition: all 0.2s;
  &:hover {
    color: #ef4444;
  }
  .el-icon {
    margin-right: 4px;
  }
}
</style>
