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
              <span>AD/LDAP 同步</span>
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
          <el-link type="primary" :underline="false" class="main-link" @click="handleEdit(row)">
            {{ row.nickname || row.username }}
          </el-link>
          <div class="sub-detail mono">{{ row.username }}</div>
        </div>
      </template>

      <!-- 身份来源 -->
      <template #identities="{ row }">
        <div class="identity-stack">
          <div
            v-for="idx in row.identities"
            :key="idx.provider"
            class="provider-pill"
            :class="idx.provider.toLowerCase()"
          >
            {{ idx.provider.toUpperCase() }}
          </div>
          <span v-if="!row.identities?.length" class="empty-text">-</span>
        </div>
      </template>

      <!-- 邮箱 -->
      <template #email="{ row }">
        <span class="column-text">{{ row.email || "-" }}</span>
      </template>

      <!-- 岗位/职称 -->
      <template #job_title="{ row }">
        <span class="column-text">{{ row.job_title || "-" }}</span>
      </template>

      <!-- 操作权限 -->
      <template #actions="{ row }">
        <el-button type="primary" link @click="handleEdit(row)">资料维护</el-button>
        <el-button type="danger" link @click="handleDelete(row)">权限注销</el-button>
      </template>
    </DataTable>

    <!-- 用户编辑/创建 弹窗 (FormDialog 风格) -->
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
      <div class="user-dialog-content">
        <UserForm
          ref="userFormRef"
          :key="currentEditId || 'create'"
          :is-edit="!!currentEditId"
          :id="currentEditId!"
          @success="handleFormSuccess"
        />
      </div>
    </FormDialog>

    <!-- LDAP 同步弹窗 -->
    <LdapSyncDialog v-model="ldapSyncVisible" @success="handleRefresh" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Search, Plus, RefreshRight, User as UserIcon, Connection } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import UserForm from "./components/UserForm.vue"
import LdapSyncDialog from "./components/LdapSyncDialog.vue"
import type { Column } from "@@/components/DataTable/types"
import { useUserList } from "./composables/useUserList"

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

const userFormRef = ref<InstanceType<typeof UserForm>>()
const submitting = ref(false)
const ldapSyncVisible = ref(false)

const tableColumns: Column[] = [
  { label: "主身份信息", prop: "username", slot: "user", minWidth: 200, align: "center" },
  { label: "电子邮箱", prop: "email", slot: "email", minWidth: 200, align: "center" },
  { label: "身份来源", prop: "identities", slot: "identities", width: 140, align: "center" },
  { label: "岗位职称", prop: "job_title", slot: "job_title", minWidth: 160, align: "center" }
]

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

.column-text {
  font-size: 12px;
  color: #475569;
}

.identity-stack {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
}

.provider-pill {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;

  &.system {
    color: #64748b;
  }
  &.ldap {
    background: #f0f9ff;
    color: #0369a1;
    border-color: #bae6fd;
  }
  &.wechat {
    background: #f0fdf4;
    color: #15803d;
    border-color: #bbf7d0;
  }
}

.empty-text {
  color: #cbd5e1;
}

.user-dialog-content {
  width: 100%;
}
</style>
