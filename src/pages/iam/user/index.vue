<template>
  <PageContainer>
    <!-- 头部治理区 -->
    <ManagerHeader title="用户治理" subtitle="全域身份主体的生命周期管理与属性维度治理" @refresh="handleRefresh">
      <template #actions>
        <div class="eiam-governance-bar">
          <!-- 组合搜索治理 -->
          <div class="search-command-inner">
            <el-icon class="search-icon"><Search /></el-icon>
            <el-input
              v-model="query.keyword"
              placeholder="搜索用户 ID、昵称或邮箱..."
              class="command-input"
              clearable
              @keyup.enter="handleRefresh"
            />
          </div>

          <!-- 动作组 -->
          <div class="action-group">
            <el-button class="eiam-secondary-btn" @click="ldapSyncVisible = true">
              <el-icon><Connection /></el-icon>
              <span>同步用户</span>
            </el-button>
            <el-button type="primary" class="eiam-primary-btn" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              <span>新增主体</span>
            </el-button>
            <el-button :icon="RefreshRight" class="eiam-refresh-btn" circle @click="handleRefresh" />
          </div>
        </div>
      </template>
    </ManagerHeader>

    <!-- 治理列表 -->
    <DataTable
      v-loading="loading"
      :data="users"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 用户身份: 采用 Governance 风格的 Dual-Line -->
      <template #user="{ row }">
        <div class="dual-line-info">
          <el-link type="primary" :underline="false" class="main-link" @click="handleView(row)">
            {{ row.nickname || row.username }}
          </el-link>
          <div class="sub-detail mono">{{ row.username }}</div>
        </div>
      </template>

      <!-- 租户成员标记 -->
      <template #is_member="{ row }">
        <el-tag v-if="row.is_member" size="small" effect="light" class="member-badge" type="success"> 已入驻 </el-tag>
        <el-tag v-else size="small" effect="plain" class="member-badge" type="info"> 未入驻 </el-tag>
      </template>

      <!-- 身份来源: 基于 Source 枚举 -->
      <template #source="{ row }">
        <div class="source-tag-group" v-if="row.source">
          <el-tag v-if="row.source === 'local'" size="small" effect="plain" type="info" class="source-pill system">
            本地登录
          </el-tag>
          <el-tag v-else-if="row.source === 'ldap'" size="small" effect="light" class="source-pill ldap">
            LDAP 同步
          </el-tag>
          <el-tag v-else-if="row.source === 'feishu'" size="small" effect="light" class="source-pill feishu">
            飞书同步
          </el-tag>
          <el-tag v-else-if="row.source === 'wechat'" size="small" effect="light" class="source-pill wechat">
            企业微信
          </el-tag>
          <el-tag v-else size="small" effect="plain" type="info"> 其它 ({{ row.source }}) </el-tag>
        </div>
        <span v-else class="empty-text">-</span>
      </template>

      <!-- 邮箱 -->
      <template #email="{ row }">
        <span class="column-text">{{ row.email || "-" }}</span>
      </template>

      <!-- 岗位/职称 -->
      <template #job_title="{ row }">
        <span class="column-text">{{ row.job_title || "-" }}</span>
      </template>

      <!-- 操作权限: 重新接入 OperateBtn -->
      <template #actions="{ row }">
        <OperateBtn :items="userOperateItems" :operate-item="row" :max-length="3" @route-event="handleOperate" />
      </template>
    </DataTable>

    <!-- 用户编辑/创建 弹窗 -->
    <FormDialog
      v-model="formVisible"
      :title="currentEditId ? '编辑主体资料' : '新增系统主体'"
      :header-icon="UserIcon"
      width="750px"
      top="10vh"
      :confirm-loading="submitting"
      @confirm="handleDrawerConfirm"
      @cancel="formVisible = false"
    >
      <!-- 保留滚动管理 -->
      <el-scrollbar max-height="65vh">
        <div class="user-dialog-content">
          <UserForm
            ref="userFormRef"
            :key="currentEditId || 'create'"
            :is-edit="!!currentEditId"
            :id="currentEditId!"
            @success="handleFormSuccess"
          />
        </div>
      </el-scrollbar>
    </FormDialog>

    <!-- LDAP 同步弹窗 -->
    <LdapSyncDialog v-model="ldapSyncVisible" @success="handleRefresh" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { Search, Plus, RefreshRight, User as UserIcon, Connection } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import UserForm from "./components/UserForm.vue"
import LdapSyncDialog from "./components/LdapSyncDialog.vue"
import type { Column } from "@@/components/DataTable/types"
import { useUserList } from "./composables/useUserList"

const router = useRouter()
const {
  users,
  total,
  currentPage,
  pageSize,
  query,
  loading,
  formVisible,
  currentEditId,
  handleRefresh,
  handleCreate,
  handleEdit,
  handleDelete,
  handleFormSuccess,
  handleSizeChange,
  handleCurrentChange
} = useUserList()

/**
 * 跳转至详情页
 */
const handleView = (row: any) => {
  router.push({
    name: "UserDetail",
    query: { id: row.id }
  })
}

const userFormRef = ref<InstanceType<typeof UserForm>>()
const submitting = ref(false)
const ldapSyncVisible = ref(false)

/**
 * 用户操作配置项
 */
const userOperateItems = [
  { name: "资料维护", code: "edit", type: "primary" },
  { name: "权限注销", code: "delete", type: "danger" }
]

const handleOperate = (row: any, code: string) => {
  if (code === "edit") handleEdit(row)
  if (code === "delete") handleDelete(row)
}

/**
 * 动态计算表头：只有当数据中包含 is_member 字段时，才展示该列
 */
const tableColumns = computed<Column[]>(() => {
  const baseColumns: Column[] = [
    { label: "主身份信息", prop: "username", slot: "user", minWidth: 200, align: "center" },
    { label: "电子邮箱", prop: "email", slot: "email", minWidth: 180, align: "center" }
  ]

  // 判定数据中是否存在 membership 装饰
  const hasMemberInfo = users.value.some((u) => u.is_member !== undefined)
  if (hasMemberInfo) {
    baseColumns.push({ label: "入驻状态", prop: "is_member", slot: "is_member", width: 120, align: "center" })
  }

  baseColumns.push(
    { label: "身份来源", prop: "source", slot: "source", width: 140, align: "center" },
    { label: "岗位职称", prop: "job_title", slot: "job_title", minWidth: 140, align: "center" }
  )

  return baseColumns
})

const handleDrawerConfirm = async () => {
  if (!userFormRef.value) return
  submitting.value = true
  try {
    await userFormRef.value.submit()
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.eiam-governance-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;

  .search-command-inner {
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0 12px;
    flex: 1;
    width: 380px;
    height: 38px;
    transition: all 0.2s;

    &:hover {
      border-color: #cbd5e1;
    }

    &:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.05);
    }

    .search-icon {
      color: #94a3b8;
      font-size: 16px;
      margin-right: 8px;
    }

    .command-input {
      width: 100%;
      :deep(.el-input__wrapper) {
        box-shadow: none !important;
        background: transparent;
        padding: 0;
        .el-input__inner {
          font-size: 13px;
          color: #1e293b;
        }
      }
    }
  }
}

.action-group {
  display: flex;
  align-items: center;
  gap: 12px;

  .eiam-secondary-btn {
    background: #eff6ff;
    border: 1px solid #dbeafe;
    border-radius: 8px;
    height: 38px;
    padding: 0 16px;
    font-weight: 600;
    color: #2563eb;
    transition: all 0.2s;

    .el-icon {
      margin-right: 6px;
      font-weight: 700;
    }

    &:hover {
      background: #dbeafe;
      border-color: #bfdbfe;
      color: #1e40af;
      transform: translateY(-1px);
    }
  }

  .eiam-primary-btn {
    background: #3b82f6;
    border: none;
    border-radius: 8px;
    height: 38px;
    padding: 0 20px;
    font-weight: 600;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
    transition: all 0.2s;

    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }
  }

  .eiam-refresh-btn {
    &:hover {
      color: #3b82f6;
      border-color: #3b82f6;
      transform: rotate(180deg);
      background: #f0f7ff;
    }
  }
}

.dual-line-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 0px;
  line-height: 1.2;

  .main-link {
    color: #1e293b;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
    justify-content: center;
    &:hover {
      color: #3b82f6;
    }
  }
  .sub-detail {
    font-size: 11px;
    color: #94a3b8;
    &.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  }
}

.member-badge {
  height: 20px;
  min-width: 52px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  line-height: 18px;
}

.column-text {
  font-size: 12px;
  color: #475569;
}

.source-tag-group {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.source-pill {
  height: 20px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  line-height: 18px;

  &.system {
    color: #64748b;
    border-color: #e2e8f0;
  }
  &.ldap {
    color: #0ea5e9;
    background-color: #f0f9ff;
    border-color: #bae6fd;
  }
  &.feishu {
    color: #2563eb;
    background-color: #eff6ff;
    border-color: #dbeafe;
  }
  &.wechat {
    color: #16a34a;
    background-color: #f0fdf4;
    border-color: #bbf7d0;
  }
}

.empty-text {
  color: #cbd5e1;
}

.user-dialog-content {
  width: 100%;
  padding-right: 12px;
}
</style>
