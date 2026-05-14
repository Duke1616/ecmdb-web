<script setup lang="ts">
import { ref, onMounted } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
import dayjs from "dayjs"
import { useRouter } from "vue-router"
import { listAuthorizationsApi } from "@/api/iam/permission"
import { batchDetachPolicyApi } from "@/api/iam/policy"
import type { Authorization } from "@/api/iam/permission/type"
import PremiumList from "@/common/components/PremiumList/index.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

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

const router = useRouter()
const { hasPermission } = usePermission()
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
  }).then(async () => {
    await batchDetachPolicyApi({
      assignments: [
        {
          sub_type: row.sub_type,
          sub_code: row.subject,
          policy_code: row.target
        }
      ]
    })
    ElMessage.success("授权移除成功！")
    fetchAssignments()
  })
}

// 批量移除权限
const handleBatchRemove = () => {
  const count = selectedItems.value.length
  ElMessageBox.confirm(`确定要批量移除这 ${count} 项授权记录吗？此操作无法撤销。`, "批量移除警告", {
    type: "warning",
    confirmButtonText: "确定批量移除",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    await batchDetachPolicyApi({
      assignments: selectedItems.value.map((item) => ({
        sub_type: item.sub_type,
        sub_code: item.subject,
        policy_code: item.target
      }))
    })
    ElMessage.success(`已成功批量移除 ${count} 项授权记录！`)
    selectedItems.value = []
    fetchAssignments()
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
      :selectable="selectable"
      v-model:selection="selectedItems"
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
          :disabled="!canBatchDetach || selectedItems.length === 0"
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
              <span>{{ dayjs(row.ctime).isValid() ? dayjs(row.ctime).format("YYYY-MM-DD HH:mm") : "-" }}</span>
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
