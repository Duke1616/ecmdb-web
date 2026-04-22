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
        <div class="dual-line-info">
          <el-link type="primary" :underline="false" class="main-link mono" @click="handleSubjectClick(row)">
            {{ row.subject }}
          </el-link>
          <div class="sub-detail">
            {{ row.sub_type === AuthorizationSubType.USER ? "IAM 用户" : "IAM 角色" }}
          </div>
        </div>
      </template>

      <!-- 授权对象 -->
      <template #target="{ row }">
        <div class="dual-line-info">
          <el-link type="primary" :underline="false" class="main-link mono" @click="handleTargetClick(row)">
            {{ row.target }}
          </el-link>
          <div class="sub-detail">
            <template v-if="row.obj_type === AuthorizationObjType.ROLE">IAM 角色</template>
            <template v-else-if="row.obj_type === AuthorizationObjType.SYSTEM_POLICY">系统策略</template>
            <template v-else-if="row.obj_type === AuthorizationObjType.CUSTOM_POLICY">自定义策略</template>
          </div>
          <div v-if="row.scope" class="sub-detail scope-tag">{{ row.scope }}</div>
        </div>
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
import { useRouter } from "vue-router"
import { Search, RefreshRight, Plus } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import AuthorizeDrawer from "./components/AuthorizeDrawer.vue"
import type { Column } from "@@/components/DataTable/types"
import { AuthorizationSubType, AuthorizationObjType, type Authorization } from "@/api/iam/permission/type"
import { useAuthorizeList } from "./composables/useAuthorizeList"
import { ElMessageBox, ElMessage } from "element-plus"

const router = useRouter()
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

/**
 * 处理主体点击跳转
 */
const handleSubjectClick = (row: Authorization) => {
  const isUser = row.sub_type === AuthorizationSubType.USER
  router.push({
    name: isUser ? "UserDetail" : "RoleDetail",
    query: isUser ? { username: row.subject } : { code: row.subject }
  })
}

/**
 * 处理对象内容点击跳转
 */
const handleTargetClick = (row: Authorization) => {
  const isRole = row.obj_type === AuthorizationObjType.ROLE
  router.push({
    name: isRole ? "RoleDetail" : "PolicyDetail",
    query: isRole ? { code: row.target } : { code: row.target }
  })
}

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
    height: 18px;
    :deep(.el-link__inner) {
      justify-content: center;
    }
    &.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
    }
    &:hover {
      color: #3b82f6;
    }
  }
  .sub-detail {
    font-size: 11px;
    color: #94a3b8;
  }
  .scope-tag {
    font-size: 10px;
    color: #6366f1;
    background: #eef2ff;
    padding: 0 6px;
    border-radius: 4px;
    display: inline-block;
    margin-top: 2px;
    width: fit-content;
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
