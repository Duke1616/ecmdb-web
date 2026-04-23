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
            <el-button type="primary" class="eiam-main-btn" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              <span>新增授权</span>
            </el-button>
            <el-button :icon="RefreshRight" class="eiam-icon-outline" circle @click="handleRefresh" />
          </div>
        </div>
      </template>
    </ManagerHeader>

    <DataTable
      v-loading="loading"
      :data="authorizations"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 授权主体 -->
      <template #subject="{ row }">
        <AssetIdentityCell
          :title="row.subject"
          :sub-title="row.sub_type === AuthorizationSubType.USER ? 'IAM 用户' : 'IAM 角色'"
          :link-to="
            row.sub_type === AuthorizationSubType.USER
              ? { name: 'UserDetail', query: { username: row.subject } }
              : { name: 'RoleDetail', query: { code: row.subject } }
          "
          centered
        />
      </template>

      <!-- 授权对象 -->
      <template #target="{ row }">
        <AssetIdentityCell
          :title="row.target"
          :sub-title="row.obj_type === AuthorizationObjType.ROLE ? 'IAM 角色' : 'IAM 策略'"
          :link-to="
            row.obj_type === AuthorizationObjType.ROLE
              ? { name: 'RoleDetail', query: { code: row.target } }
              : { name: 'PolicyDetail', query: { code: row.target } }
          "
          centered
        />
      </template>

      <!-- 备注 -->
      <template #note="{ row }">
        <span class="column-text">{{ row.note || "-" }}</span>
      </template>

      <!-- 创建时间 -->
      <template #ctime="{ row }">
        <span class="ctime-text">{{ row.ctime ? formatDate(row.ctime) : "-" }}</span>
      </template>

      <!-- 操作 -->
      <template #actions="{ row }">
        <el-button type="primary" link @click="handleRevoke(row)">解除授权</el-button>
      </template>
    </DataTable>

    <!-- 授权向导侧边栏 -->
    <AuthorizeDrawer v-model="showAuthorizeDrawer" @success="handleRefresh" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Search, RefreshRight, Plus } from "@element-plus/icons-vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import AuthorizeDrawer from "./components/AuthorizeDrawer.vue"
import type { Column } from "@@/components/DataTable/types"
import { AuthorizationSubType, AuthorizationObjType, type Authorization } from "@/api/iam/permission/type"
import { useAuthorizeList } from "./composables/useAuthorizeList"
import { ElMessageBox, ElMessage } from "element-plus"

const {
  loading,
  authorizations,
  total,
  query,
  currentPage,
  pageSize,
  handleRefresh,
  handleSizeChange,
  handleCurrentChange
} = useAuthorizeList()

const tableColumns: Column[] = [
  { label: "授权主体", prop: "subject", slot: "subject", minWidth: 150, align: "center" },
  { label: "授权对象", prop: "target", slot: "target", minWidth: 150, align: "center" },
  { label: "备注", prop: "note", slot: "note", minWidth: 200, align: "center" },
  { label: "创建时间", prop: "ctime", slot: "ctime", width: 170, align: "center" }
]

const showAuthorizeDrawer = ref(false)

const handleCreate = () => {
  showAuthorizeDrawer.value = true
}

const handleRevoke = (row: Authorization) => {
  ElMessageBox.confirm(`确定要解除对主体 ${row.subject} 的授权吗？`, "权限回收警告", {
    type: "warning",
    confirmButtonText: "确定回收",
    confirmButtonClass: "el-button--danger eiam-confirm-btn",
    cancelButtonText: "取消"
  }).then(() => {
    ElMessage.success("授权已安全回收")
  })
}

const formatDate = (ts: number) => {
  if (!ts) return "-"
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${dd} ${hh}:${mm}`
}
</script>

<style lang="scss" scoped>
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

  .eiam-main-btn {
    background: #3b82f6;
    border: none;
    border-radius: 8px;
    height: 36px;
    padding: 0 18px;
    font-weight: 600;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    transition: all 0.2s;
    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
    }
  }

  .eiam-icon-outline {
    border: 1px solid #e2e8f0;
    background: white;
    color: #64748b;
    &:hover {
      color: #0ea5e9;
      border-color: #0ea5e9;
      background: #f0f9ff;
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
