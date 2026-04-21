<script setup lang="ts">
import { ref, onMounted } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
import dayjs from "dayjs"
import { useRouter } from "vue-router"
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

const router = useRouter()
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

/**
 * 跳转到主体详情
 */
const handleSubjectClick = (row: Authorization) => {
  const isUser = row.sub_type === "user"
  router.push({
    name: isUser ? "UserDetail" : "RoleDetail",
    query: isUser ? { username: row.subject } : { code: row.subject }
  })
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
          <span>备注说明</span>
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
              <el-link type="primary" :underline="false" class="main-title" @click="handleSubjectClick(row)">
                {{ row.subject_name || row.subject }}
              </el-link>
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

          <div class="cell-note">
            <span class="note-text" :title="row.note">
              {{ row.note || "该授权项允许主体在指定资源范围内执行预定义的策略动作。" }}
            </span>
          </div>

          <div class="cell-time">
            <div class="time-item">
              <span>{{ dayjs(row.ctime).isValid() ? dayjs(row.ctime).format("YYYY-MM-DD HH:mm") : "-" }}</span>
            </div>
          </div>

          <div class="cell-actions">
            <el-button type="danger" link size="small" class="delete-btn" @click="handleRemove(row)">
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
  grid-template-columns: 240px 140px 1fr 150px 90px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
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

.cell-note {
  min-width: 0;
  .note-text {
    font-size: 13px;
    color: #64748b;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.cell-time {
  display: flex;
  justify-content: center;
  .time-item {
    font-size: 12px;
    color: #64748b;
    font-family: ui-monospace, SFMono-Regular, monospace;
  }
}

.cell-actions {
  display: flex;
  justify-content: center;
  .delete-btn {
    color: #94a3b8;
    transition: all 0.2s;
    &:hover {
      color: #ef4444;
    }
    .el-icon {
      margin-right: 4px;
    }
  }
}
</style>
