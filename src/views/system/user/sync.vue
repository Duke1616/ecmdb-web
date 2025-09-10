<template>
  <div class="sync-user-container">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-container">
        <el-input
          v-model="filterInput"
          size="large"
          placeholder="输入用户名称进行搜索..."
          :prefix-icon="Search"
          class="search-input"
          clearable
          @input="debouncedSearch"
        />
        <el-button type="primary" :icon="RefreshRight" @click="refreshCacheLdap" class="refresh-btn">
          刷新缓存
        </el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <DataTable
        :data="usersData"
        :columns="tableColumns"
        :actions="tableActions"
        :show-pagination="true"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :current-page="paginationData.currentPage"
        :page-sizes="paginationData.pageSizes"
        :pagination-layout="paginationData.layout"
        :table-props="{}"
        @action="handleTableAction"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      >
        <!-- 用户名称插槽 -->
        <template #userName="{ row }">
          <div class="user-name">
            <span>{{ row.username }}</span>
          </div>
        </template>

        <!-- 状态插槽 -->
        <template #status="{ row }">
          <el-tag :type="row.is_system_exist ? 'success' : 'warning'" effect="light" class="status-tag">
            <el-icon class="status-icon">
              <Check v-if="row.is_system_exist" />
              <Close v-else />
            </el-icon>
          </el-tag>
        </template>
      </DataTable>
    </div>

    <!-- 导入用户对话框 -->
    <FormDialog
      v-model="dialogVisible"
      title="导入用户"
      subtitle="确认导入用户信息"
      width="500px"
      header-icon="UserFilled"
      :show-footer="false"
      @closed="onClosedImportUser"
    >
      <Form ref="apiRef" @closed="onClosedImportUser" @callback="callback" />
    </FormDialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from "vue"
import { refreshCacheLdapApi, searchLdapUserApi } from "@/api/user"
import { Search, RefreshRight, Check, Close } from "@element-plus/icons-vue"
import { user } from "@/api/user/types/ldap"
import { usePagination } from "@/common/composables/usePagination"
import { debounce } from "lodash-es"
import { ElMessage } from "element-plus"
import Form from "./form.vue"
import { FormDialog } from "@@/components/Dialogs"
import DataTable from "@/common/components/DataTable/index.vue"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 8,
  layout: "total, prev, pager, next"
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)
const dialogVisible = ref<boolean>(false)
const apiRef = ref<InstanceType<typeof Form>>()

const emits = defineEmits(["closed", "listUsersData"])
const filterInput = ref<string>("")
const usersData = ref<user[]>([])

// 表格列配置
const tableColumns = [
  {
    prop: "username",
    label: "用户名称",
    minWidth: 120,
    slot: "userName"
  },
  {
    prop: "display_name",
    label: "显示名称",
    minWidth: 120
  },
  {
    prop: "title",
    label: "岗位",
    minWidth: 150
  },
  {
    prop: "is_system_exist",
    label: "状态",
    width: 100,
    slot: "status"
  }
]

// 表格操作配置
const tableActions = [
  {
    key: "import",
    label: "导入",
    type: "primary" as const,
    size: "small" as const,
    disabled: (row: user) => row.is_system_exist
  }
]
const searchLdapUser = () => {
  searchLdapUserApi({
    keywords: filterInput.value,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      usersData.value = data.users
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const callback = () => {
  searchLdapUser()
  emits("listUsersData")
}

// 关闭导入用户页面
const onClosedImportUser = () => {
  dialogVisible.value = false
}

const refreshCacheLdap = () => {
  refreshCacheLdapApi()
    .then(() => {
      if (paginationData.currentPage === 1) {
        searchLdapUser()
      } else {
        paginationData.currentPage = 1
      }

      ElMessage.success("刷新缓存成功")
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

// 处理表格操作
const handleTableAction = (key: string, row: user) => {
  if (key === "import") {
    if (row.is_system_exist === true) {
      ElMessage.warning("该用户已存在, 无需导入")
      return
    }

    dialogVisible.value = true

    nextTick(() => {
      apiRef.value?.setSyncForm(row)
    })
  }
}

const debouncedSearch = debounce(() => {
  paginationData.currentPage = 1
  searchLdapUser()
}, 388)

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], searchLdapUser, { immediate: true })
</script>
<style lang="scss" scoped>
/* 同步用户容器 */
.sync-user-container {
  height: 60vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* 搜索区域 */
.search-section {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
  flex-shrink: 0;

  .search-container {
    display: flex;
    align-items: center;
    gap: 16px;

    .search-input {
      flex: 1;
      max-width: 400px;

      :deep(.el-input__wrapper) {
        background: #f9fafb;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0 12px;
        height: 40px;
        transition: all 0.2s ease;
        box-shadow: none;

        &:hover {
          border-color: #9ca3af;
          background: #ffffff;
        }

        &.is-focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      :deep(.el-input__inner) {
        font-size: 14px;
        color: #111827;
        font-weight: 400;

        &::placeholder {
          color: #6b7280;
          font-weight: 400;
        }
      }

      :deep(.el-input__prefix) {
        color: #6b7280;
        font-size: 16px;
      }
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
    }
  }
}

/* 表格区域 */
.table-section {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .user-name {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;

    .user-icon {
      color: #3b82f6;
      font-size: 16px;
    }

    span {
      font-weight: 500;
      color: #111827;
    }
  }

  .status-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 24px;
    padding: 0;
    border-radius: 4px;

    .status-icon {
      font-size: 14px;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-section {
    padding: 14px 0;

    .search-container {
      flex-direction: column;
      gap: 12px;

      .search-input {
        max-width: none;
      }
    }
  }
}
</style>
