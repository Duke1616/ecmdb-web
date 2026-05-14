<template>
  <PageContainer>
    <ManagerHeader title="授权治理" subtitle="身份主体与权限策略的原子级关联治理" @refresh="handleRefresh">
      <template #actions>
        <div class="eiam-governance-bar">
          <!-- 搜索治理区 -->
          <div class="search-command-inner">
            <el-input
              v-model="query.keyword"
              placeholder="全域搜索授权条目..."
              class="command-input"
              clearable
              @keyup.enter="handleRefresh"
            >
              <template #prefix>
                <el-icon class="search-icon"><Search /></el-icon>
              </template>
            </el-input>

            <div class="divider" />

            <!-- 主体过滤 -->
            <el-select
              v-model="query.sub_type"
              placeholder="主体类型"
              clearable
              class="command-select"
              @change="handleRefresh"
            >
              <el-option label="所有主体" value="" />
              <el-option label="IAM 用户" :value="AuthorizationSubType.USER" />
              <el-option label="IAM 角色" :value="AuthorizationSubType.ROLE" />
            </el-select>

            <!-- 对象过滤 -->
            <el-select
              v-model="query.obj_type"
              placeholder="对象类型"
              clearable
              class="command-select"
              @change="handleRefresh"
            >
              <el-option label="所有对象" value="" />
              <el-option label="所有角色" :value="AuthorizationObjType.ROLE" />
              <el-option label="系统策略" :value="AuthorizationObjType.SYSTEM_POLICY" />
              <el-option label="自定义策略" :value="AuthorizationObjType.CUSTOM_POLICY" />
            </el-select>
          </div>

          <!-- 主动作区 -->
          <div class="action-group">
            <template v-if="selectedRows.length > 0">
              <el-button
                class="u-gov-btn is-danger is-large"
                :disabled="!hasPermission(IAM_CAPABILITIES.Policy.BatchDetach)"
                @click="handleBatchRevoke(selectedRows)"
              >
                <el-icon><Delete /></el-icon>
                <span>批量解除 ({{ selectedRows.length }})</span>
              </el-button>
            </template>
            <template v-else>
              <el-button
                class="u-gov-btn is-large"
                :disabled="!hasPermission(IAM_CAPABILITIES.Policy.BatchAttach)"
                @click="handleCreate"
              >
                <el-icon><Plus /></el-icon>
                <span>新增授权</span>
              </el-button>
            </template>
            <el-button :icon="RefreshRight" class="eiam-icon-outline" circle @click="handleRefresh" />
          </div>
        </div>
      </template>
    </ManagerHeader>

    <DataTable
      ref="tableRef"
      v-loading="loading"
      :data="authorizations"
      :columns="tableColumns"
      :show-selection="true"
      :selectable="isSelectable"
      :table-props="!hasPermission(IAM_CAPABILITIES.Policy.BatchDetach) ? { class: 'selection-disabled' } : {}"
      :show-pagination="true"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      @selection-change="handleSelectionChange"
    >
      <!-- 授权主体 -->
      <template #subject="{ row }">
        <AssetIdentityCell
          :title="row.subject"
          :sub-title="row.sub_type === AuthorizationSubType.USER ? 'IAM 用户' : 'IAM 角色'"
          :link-to="getSubjectLink(row)"
          centered
        />
      </template>

      <!-- 授权对象 -->
      <template #target="{ row }">
        <AssetIdentityCell
          :title="row.target_name || row.target"
          :sub-title="row.obj_type === AuthorizationObjType.ROLE ? 'IAM 角色' : '权限策略'"
          :link-to="getTargetLink(row)"
          centered
        />
      </template>

      <!-- 备注 -->
      <template #note="{ row }">
        <span class="column-text">{{ row.note || "-" }}</span>
      </template>

      <!-- 创建时间 -->
      <template #ctime="{ row }">
        <span class="ctime-text">{{ formatTimestamp(row.ctime) || "-" }}</span>
      </template>

      <!-- 操作 -->
      <template #actions="{ row }">
        <OperateBtn :items="OPERATE_BUTTONS" :operate-item="row" :max-length="2" @route-event="handleOperateEvent" />
      </template>
    </DataTable>

    <!-- 授权向导侧边栏 -->
    <AuthorizeDrawer v-model="showAuthorizeDrawer" @success="handleRefresh" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { Search, RefreshRight, Plus, Delete } from "@element-plus/icons-vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import AuthorizeDrawer from "./components/AuthorizeDrawer.vue"
import type { Column } from "@@/components/DataTable/types"
import { type Authorization, AuthorizationSubType, AuthorizationObjType } from "@/api/iam/permission/type"
import { useAuthorizeList } from "./composables/useAuthorizeList"
import { formatTimestamp } from "@@/utils/day"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

const {
  loading,
  authorizations,
  total,
  query,
  currentPage,
  pageSize,
  handleRefresh,
  handleSizeChange,
  handleCurrentChange,
  handleRevoke,
  handleBatchRevoke
} = useAuthorizeList()

const { hasPermission } = usePermission()

const tableColumns: Column[] = [
  { label: "授权主体", prop: "subject", slot: "subject", minWidth: 150, align: "center" },
  { label: "授权对象", prop: "target", slot: "target", minWidth: 150, align: "center" },
  { label: "备注", prop: "note", slot: "note", minWidth: 200, align: "center" },
  { label: "创建时间", prop: "ctime", slot: "ctime", width: 170, align: "center" }
]

const OPERATE_BUTTONS = computed(() => [
  {
    name: "解除授权",
    code: "revoke",
    type: "danger",
    icon: Delete,
    disabled: !hasPermission(IAM_CAPABILITIES.Policy.Detach)
  }
])

const showAuthorizeDrawer = ref(false)
const selectedRows = ref<Authorization[]>([])
const tableRef = ref<InstanceType<typeof DataTable>>()

/**
 * 判定行是否可勾选：拥有单条解绑或批量解绑权限的用户可以勾选
 */
const isSelectable = () => hasPermission(IAM_CAPABILITIES.Policy.BatchDetach)

/**
 * 动态计算主体详情跳转链接 (带权限校验)
 */
const getSubjectLink = (row: Authorization) => {
  const isUser = row.sub_type === AuthorizationSubType.USER
  const capability = isUser ? IAM_CAPABILITIES.User.Detail : IAM_CAPABILITIES.Role.Detail

  if (!hasPermission(capability)) return undefined

  return isUser
    ? { name: "UserDetail", query: { username: row.subject } }
    : { name: "RoleDetail", query: { code: row.subject } }
}

/**
 * 动态计算对象详情跳转链接 (带权限校验)
 */
const getTargetLink = (row: Authorization) => {
  // 判断对象类型：可能是 Role (角色继承) 或 Policy (直接授权)
  const isRoleTarget = row.obj_type === AuthorizationObjType.ROLE

  if (isRoleTarget) {
    if (!hasPermission(IAM_CAPABILITIES.Role.Detail)) return undefined
    return { name: "RoleDetail", query: { code: row.target } }
  }

  // 默认视为 Policy 类型
  if (!hasPermission(IAM_CAPABILITIES.Policy.Detail)) return undefined
  return { name: "PolicyDetail", query: { code: row.target } }
}

const handleOperateEvent = (row: Authorization, code: string) => {
  if (code === "revoke") {
    handleRevoke(row)
  }
}

const handleSelectionChange = (val: Authorization[]) => {
  selectedRows.value = val
}

const handleCreate = () => {
  showAuthorizeDrawer.value = true
}
</script>

<style lang="scss" scoped>
/* NOTE: 无批量解除权限时，禁用表头全选 Checkbox */
:deep(.selection-disabled) {
  .el-table__header-wrapper .el-checkbox {
    pointer-events: none;
    opacity: 0.4;
  }
}

.eiam-governance-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;

  .search-command-inner {
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    border-radius: 8px;
    padding: 0 12px;
    flex: 1;
    max-width: 680px;
    height: 38px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:focus-within {
      border-color: #0ea5e9;
    }

    .command-input {
      width: 240px;
      :deep(.el-input__wrapper) {
        box-shadow: none !important;
        background: transparent;
        padding: 0;
      }
      .search-icon {
        color: #94a3b8;
        font-size: 16px;
      }
    }

    .divider {
      width: 1px;
      height: 16px;
      background: #e2e8f0;
      margin: 0 8px;
      flex-shrink: 0;
    }

    .command-select {
      width: 120px;
      :deep(.el-select__wrapper) {
        box-shadow: none !important;
        background: transparent;
        padding: 0 8px;

        .el-select__placeholder {
          color: #64748b;
          font-size: 13px;
        }
      }
    }
  }
}

.action-group {
  display: flex;
  align-items: center;
  gap: 12px;

  .eiam-icon-outline {
    width: 38px;
    height: 38px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    background: white;
    color: #64748b;
    transition: all 0.2s;
    &:hover {
      color: #409eff;
      border-color: #409eff;
      background: #f0f9ff;
      transform: translateY(-1px);
    }
  }
}

.column-text {
  font-size: 12px;
  color: #475569;
}

.ctime-text {
  font-size: 11px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, monospace;
}
</style>
