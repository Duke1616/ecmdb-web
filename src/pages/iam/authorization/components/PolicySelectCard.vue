<script setup lang="ts">
import { watch } from "vue"
import { Search, Close, Connection } from "@element-plus/icons-vue"
import { listPoliciesApi } from "@/api/iam/policy"
import type { Policy } from "@/api/iam/policy/type"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

const props = defineProps<{
  // 外部同步选中的列表
  selection: Policy[]
  // 卡片标题，默认为“权限策略”
  title?: string
  // 是否显示高风险标记
  showRisk?: boolean
  // 是否开启扁平模式（无边框、无阴影，适用于嵌入式场景）
  flat?: boolean
}>()

const emit = defineEmits<{
  (e: "update:selection", val: Policy[]): void
}>()

// --- 识别高风险策略 ---
const isHighRisk = (name: string) => {
  if (!props.showRisk) return false
  const risks = ["Admin", "FullAccess", "Owner", "Super"]
  return risks.some((r) => name.toLowerCase().includes(r.toLowerCase()))
}

// --- 权限策略治理选择器核心逻辑 ---
const policySelector = useResourceSelector<Policy, { keyword: string; type: string | number }>({
  fetchApi: listPoliciesApi,
  listKey: "policies",
  rowKey: (row: Policy) => `${row.type}-${row.code}`,
  initialQuery: { keyword: "", type: "" }
})

// --- 外部同步逻辑 ---
// 当内部选中列表变化时，向外派发事件
watch(
  () => policySelector.selectedList.value,
  (newList) => {
    emit("update:selection", newList)
  },
  { deep: true }
)

// 当外部清空或修改 selection 时，同步内部 Map 和 Table 勾选状态
watch(
  () => props.selection,
  (newSelection) => {
    if (newSelection.length === 0 && policySelector.selectedTotal.value > 0) {
      policySelector.clearSelection()
    }
  },
  { deep: true }
)

// 对外暴露主动刷新的方法
defineExpose({
  fetchList: policySelector.fetchList,
  reset: policySelector.reset
})
</script>

<template>
  <div class="governance-card policy-select-card" :class="{ 'is-flat': flat }">
    <div class="card-header">
      <div class="title-wrap">
        <el-icon class="main-icon"><Connection /></el-icon>
        <span class="text">{{ title || "权限策略" }}</span>
      </div>
      <div class="header-actions">
        <el-button
          v-if="policySelector.selectedTotal.value > 0"
          link
          type="danger"
          size="small"
          @click="policySelector.clearSelection()"
        >
          清空已选
        </el-button>
      </div>
    </div>

    <div class="dual-panel-container">
      <!-- 左侧：源列表面板 -->
      <div class="panel-source">
        <div class="panel-source-header">
          <el-input
            v-model="policySelector.query.keyword"
            placeholder="搜索策略名称或标识..."
            class="search-input"
            clearable
            @input="policySelector.debouncedSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-radio-group
            v-model="policySelector.query.type"
            class="eiam-radio-filter"
            @change="policySelector.fetchList"
          >
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button :value="1">系统</el-radio-button>
            <el-radio-button :value="2">自定义</el-radio-button>
          </el-radio-group>
        </div>

        <el-table
          :ref="policySelector.tableRef"
          v-loading="policySelector.loading.value"
          :data="policySelector.list.value"
          height="100%"
          :row-key="(row) => String(row.type) + '-' + row.code"
          @selection-change="policySelector.handleSelectionChange"
        >
          <el-table-column type="selection" width="40" reserve-selection />
          <el-table-column label="策略资产" width="160">
            <template #default="{ row }">
              <div class="policy-info">
                <div class="name-box">
                  <span class="policy-name">{{ row.name }}</span>
                  <el-tag v-if="isHighRisk(row.name)" type="danger" size="small" effect="dark" class="risk-badge"
                    >高风险</el-tag
                  >
                </div>
                <span class="policy-code mono">{{ row.code }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <span class="type-badge" :class="row.type === 1 ? 'system' : 'custom'">
                {{ row.type === 1 ? "系统" : "自定义" }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="desc-text">{{ row.desc || "-" }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="policySelector.query.page"
            v-model:page-size="policySelector.query.limit"
            small
            background
            layout="total, prev, pager, next"
            :total="policySelector.total.value"
            @current-change="policySelector.fetchList"
          />
        </div>
      </div>

      <!-- 右侧：购物车缓冲区 -->
      <div class="panel-buffer">
        <div class="buffer-header">
          <span>已选授权项</span>
          <span class="count-tag">{{ policySelector.selectedTotal.value }}</span>
        </div>
        <div class="buffer-list">
          <TransitionGroup name="list-fade">
            <div
              v-for="item in policySelector.selectedList.value"
              :key="String(item.type) + '-' + item.code"
              class="buffer-item"
            >
              <div class="info">
                <span class="name">{{ item.name }}</span>
                <span class="id mono">{{ item.code }}</span>
              </div>
              <div class="actions">
                <el-icon class="remove-btn" @click="policySelector.removeSelection(item)"><Close /></el-icon>
              </div>
            </div>
          </TransitionGroup>
          <el-empty v-if="policySelector.selectedTotal.value === 0" description="点击左侧勾选" :image-size="40" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.governance-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  }

  .card-header {
    padding: 14px 20px;
    background: #ffffff;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      .main-icon {
        color: #6366f1;
        font-size: 18px;
        background: #f5f3ff;
        padding: 6px;
        border-radius: 8px;
      }
      .text {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
      }
    }
  }

  &.is-flat {
    border: none;
    border-radius: 0;
    box-shadow: none;

    &:hover {
      box-shadow: none;
    }

    .card-header {
      background: #ffffff;
      padding: 20px 24px 10px;
      border-bottom: none;

      .main-icon {
        background: #f8fafc;
      }
    }
  }
}

.dual-panel-container {
  display: flex;
  height: 480px;

  .is-flat & {
    height: 520px;
    padding: 0 24px 24px;
  }
}

.panel-source {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f1f5f9;
  background: #ffffff;

  .is-flat & {
    border: 1px solid #f1f5f9;
    border-radius: 12px 0 0 12px;
  }

  .panel-source-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    .search-input {
      flex: 1;
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        background-color: #f8fafc;
        box-shadow: 0 0 0 1px #e2e8f0 inset;
      }
    }

    .eiam-radio-filter {
      flex-shrink: 0;
      :deep(.el-radio-button__inner) {
        height: 32px;
        display: inline-flex;
        align-items: center;
        font-size: 12px;
      }
    }
  }

  .pagination-bar {
    margin-top: auto;
    padding-top: 12px;
    display: flex;
    justify-content: flex-end;
  }
}

.panel-buffer {
  width: 260px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;

  .is-flat & {
    border: 1px solid #f1f5f9;
    border-left: none;
    border-radius: 0 12px 12px 0;
    background: #fbfcfd;
  }

  .buffer-header {
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;

    .count-tag {
      background: #6366f1;
      color: white;
      padding: 0 8px;
      height: 18px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
    }
  }

  .buffer-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.buffer-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 80%;

    .name {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .id {
      font-size: 10px;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .remove-btn {
    cursor: pointer;
    color: #94a3b8;
    &:hover {
      color: #ef4444;
    }
  }
}

.policy-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .name-box {
    display: flex;
    align-items: center;
    gap: 6px;
    .policy-name {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
  }
  .policy-code {
    font-size: 10px;
    color: #94a3b8;
  }
}

.risk-badge {
  padding: 0 4px;
  height: 16px;
  font-size: 9px;
  font-weight: 700;
}

.type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  &.system {
    background: #f1f5f9;
    color: #475569;
  }
  &.custom {
    background: #dcfce7;
    color: #15803d;
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
}

.desc-text {
  font-size: 12px;
  color: #64748b;
}

.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.2s ease;
}
.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  font-size: 12px;
}
</style>
