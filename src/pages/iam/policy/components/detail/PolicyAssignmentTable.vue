<script setup lang="ts">
import { ref, onMounted } from "vue"
import { Plus, Calendar } from "@element-plus/icons-vue"
import dayjs from "dayjs"
import { listAuthorizationsApi } from "@/api/iam/permission"
import type { Authorization } from "@/api/iam/permission/type"
import PremiumList from "@/common/components/PremiumList/index.vue"
import { ElMessage, ElMessageBox } from "element-plus"

interface Props {
  policyCode: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: "add"): void
}>()

const loading = ref(false)
const list = ref<Authorization[]>([])
const total = ref(0)
const selectedItems = ref<Authorization[]>([])
const query = ref({
  currentPage: 1,
  pageSize: 10,
  keyword: ""
})

/**
 * 核心：修复 API 调用时的解构逻辑，确保获取的是业务 data
 */
const fetchAssignments = async () => {
  loading.value = true
  try {
    const { data } = await listAuthorizationsApi({
      keyword: query.value.keyword || props.policyCode,
      offset: (query.value.currentPage - 1) * query.value.pageSize,
      limit: query.value.pageSize
    })
    list.value = data.authorizations
    total.value = data.total
    selectedItems.value = [] // 翻页或刷新时清空选中的项
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  query.value.currentPage = page
  fetchAssignments()
}

// 修复：处理搜索事件
const handleSearch = (keyword: string) => {
  query.value.keyword = keyword
  query.value.currentPage = 1
  fetchAssignments()
}

// 移除单一权限
const handleRemove = (row: Authorization) => {
  ElMessageBox.confirm(`确定要移除对主体 [${row.subject}] 的授权吗？`, "移除授权警告", {
    type: "warning",
    confirmButtonText: "确定移除",
    confirmButtonClass: "el-button--danger"
  }).then(() => {
    ElMessage.success("授权移除成功！")
    fetchAssignments() // 模拟成功后刷新
  })
}

// 批量移除权限
const handleBatchRemove = () => {
  const count = selectedItems.value.length
  ElMessageBox.confirm(`确定要批量移除这 ${count} 项授权记录吗？此操作无法撤销。`, "批量移除警告", {
    type: "warning",
    confirmButtonText: "确定批量移除",
    confirmButtonClass: "el-button--danger"
  }).then(() => {
    ElMessage.success(`已成功批量移除 ${count} 项授权记录！`)
    fetchAssignments() // 模拟成功后刷新
  })
}

onMounted(() => {
  fetchAssignments()
})

// 暴露方法给父组件，用于刷新
defineExpose({
  fetchAssignments
})
</script>

<template>
  <div class="policy-assignment-table">
    <PremiumList
      :data="list"
      :total="total"
      :loading="loading"
      :current-page="query.currentPage"
      :page-size="query.pageSize"
      title="授权关系治理"
      search-placeholder="搜索关联的主体标识、名称或备注..."
      indicator-color="#3b82f6"
      show-selection
      row-key="id"
      v-model:selection="selectedItems"
      @page-change="handlePageChange"
      @search="handleSearch"
    >
      <!-- 表头定义 -->
      <template #column-header>
        <div class="assign-cols header-label-font">
          <span>授权主体</span>
          <span>资源范围</span>
          <span>备注</span>
          <span class="align-center">授权时间</span>
          <span class="align-center">操作</span>
        </div>
      </template>

      <!-- 头部操作 -->
      <template #header-actions>
        <el-button plain class="toolbar-action-btn" @click="emit('add')">
          <el-icon><Plus /></el-icon>
          <span>新增授权主体</span>
        </el-button>
      </template>

      <!-- 批量操作 -->
      <template #batch-actions>
        <el-button type="danger" plain size="small" @click="handleBatchRemove">
          <el-icon><Delete /></el-icon>
          <span>批量移除</span>
        </el-button>
      </template>

      <!-- 列表项内容 -->
      <template #item="{ item: row }">
        <div class="assign-grid-row">
          <div class="cell-subject">
            <div class="dual-line-info">
              <span class="main-title">{{ row.target_name || row.subject_name || row.subject }}</span>
              <div class="sub-detail">
                {{ row.sub_type === "user" ? "IAM 用户" : "IAM 角色" }}
              </div>
            </div>
          </div>

          <div class="cell-scope">
            <div class="scope-text" :class="{ global: row.scope === '*' }">
              <code>{{ row.scope === "*" ? "全局所有资源" : row.scope || "-" }}</code>
            </div>
          </div>

          <div class="cell-note">
            <span class="note-text">{{ row.note || "-" }}</span>
          </div>

          <div class="cell-time">
            <div class="time-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ dayjs(row.ctime).isValid() ? dayjs(row.ctime).format("YYYY-MM-DD HH:mm:ss") : "-" }}</span>
            </div>
          </div>

          <div class="cell-actions">
            <el-button type="danger" link size="small" title="回收权限" @click="handleRemove(row)"> 移除 </el-button>
          </div>
        </div>
      </template>
    </PremiumList>
  </div>
</template>

<style lang="scss" scoped>
.toolbar-action-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 9px;
  border-color: #3b82f6;
  background: #3b82f6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;

  :deep(.el-icon) {
    margin-right: 6px;
    font-size: 14px;
  }

  &:hover {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }
}

.header-label-font {
  font-size: 12px;
  font-weight: 600;
  color: #8a99ad;
  letter-spacing: 0.01em;
}

.assign-cols {
  display: grid;
  grid-template-columns: 240px 140px 1fr 180px 60px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
  }
}

.assign-grid-row {
  display: grid;
  grid-template-columns: 240px 140px 1fr 180px 60px;
  align-items: center;
  gap: 24px;
  min-height: 72px;
  margin: 0 -24px;
  padding: 0 24px;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
  }
}

.cell-subject {
  .dual-line-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .main-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .sub-detail {
      font-size: 13px;
      color: #64748b;
    }
  }
}

.cell-scope {
  .scope-text {
    code {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 12px;
      color: #475569;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      word-break: break-all;
    }
    &.global code {
      background: #eef2ff;
      color: #6366f1;
      font-weight: 700;
    }
  }
}

.cell-note {
  .note-text {
    font-size: 13px;
    color: #475569;
    line-height: 1.5;
    word-break: break-all;
    display: inline-block;
    max-width: 100%;
  }
}

.cell-time {
  display: flex;
  justify-content: center;
  .time-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
    .el-icon {
      color: #94a3b8;
    }
  }
}

.cell-actions {
  display: flex;
  justify-content: center;
  .el-button {
    font-weight: 600;
    &:hover {
      color: #ef4444;
    }
  }
}
</style>
