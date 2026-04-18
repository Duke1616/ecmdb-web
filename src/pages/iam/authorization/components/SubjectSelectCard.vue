<script setup lang="ts">
import { watch } from "vue"
import { Search, User, Close } from "@element-plus/icons-vue"
import { searchSubjectsApi } from "@/api/iam/permission"
import type { Subject } from "@/api/iam/permission/type"
import { useResourceSelector } from "@/pages/iam/authorization/composables/useResourceSelector"

const props = defineProps<{
  // 外部同步选中的列表
  selection: Subject[]
  // 卡片标题，默认为“授权主体”
  title?: string
  // 是否关闭边框和阴影（扁平模式）
  flat?: boolean
}>()

const emit = defineEmits<{
  (e: "update:selection", val: Subject[]): void
}>()

// --- 授权主体治理选择器核心逻辑 (Subject) ---
const subjectSelector = useResourceSelector<Subject, { keyword: string; sub_type: string }>({
  fetchApi: searchSubjectsApi,
  listKey: "subjects",
  rowKey: (row: Subject) => `${row.type}-${row.id}`,
  initialQuery: { keyword: "", sub_type: "" }
})

// --- 外部同步逻辑 ---
watch(
  () => subjectSelector.selectedList.value,
  (newList) => {
    emit("update:selection", newList)
  },
  { deep: true }
)

watch(
  () => props.selection,
  (newSelection) => {
    if (newSelection.length === 0 && subjectSelector.selectedTotal.value > 0) {
      subjectSelector.clearSelection()
    }
  },
  { deep: true }
)

// 对外暴露主动刷新的方法
defineExpose({
  fetchList: subjectSelector.fetchList,
  reset: subjectSelector.reset
})
</script>

<template>
  <div class="governance-card subject-select-card" :class="{ 'is-flat': flat }">
    <div class="card-header">
      <div class="title-wrap">
        <el-icon class="main-icon"><User /></el-icon>
        <span class="text">{{ title || "授权主体" }}</span>
      </div>
      <div class="header-actions">
        <el-button
          v-if="subjectSelector.selectedTotal.value > 0"
          link
          type="danger"
          size="small"
          @click="subjectSelector.clearSelection()"
        >
          清空已选
        </el-button>
      </div>
    </div>

    <div class="dual-panel-container">
      <div class="panel-source">
        <div class="panel-source-header">
          <el-input
            v-model="subjectSelector.query.keyword"
            placeholder="搜索主体名称或标识..."
            class="search-input"
            clearable
            @input="subjectSelector.debouncedSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-radio-group
            v-model="subjectSelector.query.sub_type"
            class="eiam-radio-filter"
            @change="subjectSelector.fetchList"
          >
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button value="user">用户</el-radio-button>
            <el-radio-button value="role">角色</el-radio-button>
          </el-radio-group>
        </div>
        <el-table
          :ref="subjectSelector.tableRef"
          v-loading="subjectSelector.loading.value"
          :data="subjectSelector.list.value"
          height="100%"
          :row-key="(row) => row.type + '-' + row.id"
          @selection-change="subjectSelector.handleSelectionChange"
        >
          <el-table-column type="selection" width="40" reserve-selection />
          <el-table-column label="身份标识" width="140">
            <template #default="{ row }">
              <div class="identity-info">
                <span class="display-name">{{ row.name }}</span>
                <span class="id-tag mono">{{ row.id }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <span class="type-badge" :class="row.type">{{ row.type === "user" ? "用户" : "角色" }}</span>
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
            v-model:current-page="subjectSelector.query.page"
            v-model:page-size="subjectSelector.query.limit"
            small
            background
            layout="total, prev, pager, next"
            :total="subjectSelector.total.value"
            @current-change="subjectSelector.fetchList"
          />
        </div>
      </div>

      <div class="panel-buffer">
        <div class="buffer-header">
          <span>已选主体</span>
          <span class="count-tag">{{ subjectSelector.selectedTotal.value }}</span>
        </div>
        <div class="buffer-list">
          <TransitionGroup name="list-fade">
            <div
              v-for="item in subjectSelector.selectedList.value"
              :key="item.type + '-' + item.id"
              class="buffer-item"
            >
              <div class="info">
                <span class="name">{{ item.name }}</span>
                <span class="id mono">{{ item.id }}</span>
              </div>
              <div class="actions">
                <span class="type-badge small" :class="item.type">{{ item.type === "user" ? "用户" : "角色" }}</span>
                <el-icon class="remove-btn" @click="subjectSelector.removeSelection(item)"><Close /></el-icon>
              </div>
            </div>
          </TransitionGroup>
          <el-empty v-if="subjectSelector.selectedTotal.value === 0" description="点击左侧勾选" :image-size="40" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 样式与 PolicySelectCard.vue 保持高度一致 */
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
    border-radius: 0;
    box-shadow: none;

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
  min-height: 0;

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
      background: #0ea5e9;
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
    width: 65%;

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

  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .remove-btn {
    cursor: pointer;
    color: #94a3b8;
    &:hover {
      color: #ef4444;
    }
  }
}

.identity-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .display-name {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }
  .id-tag {
    font-size: 10px;
    color: #64748b;
  }
}

.type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  &.user {
    background: #e0f2fe;
    color: #0284c7;
  }
  &.role {
    background: #fef3c7;
    color: #d97706;
  }
  &.small {
    font-size: 10px;
    padding: 0 4px;
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
