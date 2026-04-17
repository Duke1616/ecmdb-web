<template>
  <PageContainer>
    <!-- 头部治理区 -->
    <ManagerHeader title="角色治理" subtitle="定义身份角色及其权限边界，支持多维度的授权治理" @refresh="handleRefresh">
      <template #actions>
        <div class="eiam-governance-bar">
          <!-- 搜索治理 -->
          <div class="search-command-inner">
            <el-icon class="search-icon"><Search /></el-icon>
            <el-input
              v-model="query.keyword"
              placeholder="搜索角色名称或标识..."
              class="command-input"
              clearable
              @keyup.enter="handleRefresh"
            />
          </div>

          <!-- 动作组 -->
          <div class="action-group">
            <el-button type="primary" class="eiam-primary-btn" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              <span>新增角色</span>
            </el-button>
            <el-button :icon="RefreshRight" class="eiam-refresh-btn" circle @click="handleRefresh" />
          </div>
        </div>
      </template>
    </ManagerHeader>

    <!-- 治理列表 -->
    <DataTable
      v-loading="loading"
      :data="roles"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 角色核心信息: Dual-Line 风格 -->
      <template #role_info="{ row }">
        <div class="dual-line-info">
          <el-link type="primary" :underline="false" class="main-link" @click="handleEdit(row)">
            {{ row.name }}
          </el-link>
          <div class="sub-detail mono">{{ row.code }}</div>
        </div>
      </template>

      <!-- 角色类型: 采用 Badge 风格提高识别度 -->
      <template #type="{ row }">
        <div class="type-indicator" :class="row.type === RoleType.SYSTEM ? 'is-system' : 'is-custom'">
          <span class="dot" />
          {{ row.type === RoleType.SYSTEM ? "系统预设" : "自定义角色" }}
        </div>
      </template>

      <!-- 操作权限 -->
      <template #actions="{ row }">
        <el-button type="primary" link @click="handleEdit(row)">资料维护</el-button>
        <el-button type="danger" link @click="handleDelete(row)">角色注销</el-button>
      </template>
    </DataTable>

    <!-- 角色编辑/创建 弹窗 -->
    <FormDialog
      v-model="formVisible"
      :title="currentEditId ? '编辑角色资料' : '新增系统角色'"
      :header-icon="UserIcon"
      width="700px"
      :confirm-loading="submitting"
      @confirm="handleConfirm"
      @cancel="formVisible = false"
    >
      <RoleForm
        ref="roleFormRef"
        :id="currentEditId!"
        :code="currentEditCode!"
        :is-edit="!!currentEditId"
        @success="handleFormSuccess"
      />
    </FormDialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Search, Plus, RefreshRight, User as UserIcon } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import RoleForm from "./components/RoleForm.vue"
import type { Column } from "@@/components/DataTable/types"
import { useRoleList } from "./composables/useRoleList"
import { RoleType } from "@/api/iam/role/type"

const {
  roles,
  total,
  currentPage,
  pageSize,
  query,
  loading,
  formVisible,
  currentEditId,
  currentEditCode,
  handleRefresh,
  handleCreate,
  handleEdit,
  handleDelete,
  handleFormSuccess,
  handleSizeChange,
  handleCurrentChange
} = useRoleList()

const roleFormRef = ref<InstanceType<typeof RoleForm>>()
const submitting = ref(false)

const tableColumns: Column[] = [
  { label: "角色核心资产", prop: "name", slot: "role_info", align: "center" },
  { label: "角色来源/类型", prop: "type", slot: "type", align: "center" },
  { label: "职责描述说明", prop: "desc", align: "center" }
]

const handleConfirm = async () => {
  if (!roleFormRef.value) return
  submitting.value = true
  try {
    await roleFormRef.value.submit()
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

  .eiam-refresh-btn {
    width: 38px;
    height: 38px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #64748b;
    transition: all 0.2s;

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

/* 角色类型指示器 (极简朴素版) */
.type-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;
    flex-shrink: 0;
  }

  &.is-system {
    color: #b45309;
    .dot {
      background: #f59e0b;
    }
  }

  &.is-custom {
    color: #64748b;
    .dot {
      background: #cbd5e1;
    }
  }
}
</style>
