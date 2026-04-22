<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { Delete, Edit, OfficeBuilding, Lock } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import TenantForm from "./components/TenantForm.vue"

// Composables
import { useTenantDetail } from "./composables/useTenantDetail"
import { useTenantGovernance } from "./composables/useTenantGovernance"

// Components
import TenantMemberTable from "./components/detail/TenantMemberTable.vue"
import UserSelectDrawer from "./components/detail/UserSelectDrawer.vue"

const router = useRouter()
const { tenantInfo, loading: detailLoading, handleDelete, copyText, formatTimestamp } = useTenantDetail()
const {
  activeTab,
  members,
  memberTotal,
  memberLoading,
  memberQuery,
  assignConfirmLoading,
  handleMemberPageChange,
  handleMemberSearch,
  handleBatchAssignMember
} = useTenantGovernance(() => tenantInfo.value?.id)

const editVisible = ref(false)
const assignVisible = ref(false)
const tenantFormRef = ref<InstanceType<typeof TenantForm>>()
const submitting = ref(false)

const handleEditSuccess = () => {
  editVisible.value = false
  window.location.reload()
}

const handleEditConfirm = async () => {
  if (!tenantFormRef.value) return
  submitting.value = true
  try {
    await tenantFormRef.value.submit()
  } finally {
    submitting.value = false
  }
}

// 分派处理
const onAssignConfirm = async (userIds: number[]) => {
  const success = await handleBatchAssignMember(userIds)
  if (success) {
    assignVisible.value = false
  }
}
</script>

<template>
  <PageContainer v-loading="detailLoading" class="tenant-detail-page">
    <template v-if="tenantInfo">
      <ManagerHeader
        :title="tenantInfo.name"
        :subtitle="tenantInfo.code"
        :show-back-button="true"
        @back="router.back()"
      >
        <template #actions>
          <div class="header-action-stack">
            <el-button class="gov-action-btn primary" @click="editVisible = true">
              <el-icon><Edit /></el-icon>
              <span>完善资料</span>
            </el-button>
            <el-button class="gov-action-btn danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              <span>销毁空间</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <!-- 身份识别资料 -->
        <div class="info-card consolidated-card">
          <div class="info-header">
            <el-icon><OfficeBuilding /></el-icon>
            <span>租户空间身份标识</span>
          </div>
          <div class="info-content grid-4-cols">
            <div class="info-item">
              <div class="label">租户正式名称</div>
              <div class="value">{{ tenantInfo.name }}</div>
            </div>
            <div class="info-item">
              <div class="label">空间编码</div>
              <div class="value mono copyable" @click="copyText(tenantInfo.code)">
                {{ tenantInfo.code }}
              </div>
            </div>
            <div class="info-item">
              <div class="label">登录域名</div>
              <div class="value mono">{{ tenantInfo.domain || "iam.ecmdb.com" }}</div>
            </div>
            <div class="info-item full">
              <div class="label">空间职责定义</div>
              <div class="value desc">
                本项目租户空间用于隔离 {{ tenantInfo.name }} 的资源与权限子集，确保数据与策略的强制隔离。
              </div>
            </div>
          </div>
        </div>

        <!-- 治理内容 -->
        <div class="governance-tabs-card">
          <el-tabs v-model="activeTab" class="governance-raw-tabs">
            <el-tab-pane label="成员管理" name="members">
              <TenantMemberTable
                :loading="memberLoading"
                :data="members"
                :total="memberTotal"
                :current-page="memberQuery.currentPage"
                :pageSize="memberQuery.pageSize"
                :format-timestamp="formatTimestamp"
                @page-change="handleMemberPageChange"
                @search="handleMemberSearch"
                @add="assignVisible = true"
                @unbind="(row) => $message.warning(`即将移除成员: ${row.username}`)"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 编辑弹窗 -->
      <FormDialog
        v-model="editVisible"
        title="完善租户资料"
        :header-icon="Lock"
        width="640px"
        :confirm-loading="submitting"
        @confirm="handleEditConfirm"
        @cancel="editVisible = false"
      >
        <TenantForm ref="tenantFormRef" :is-edit="true" :id="tenantInfo?.id" @success="handleEditSuccess" />
      </FormDialog>

      <!-- 分派成员抽屉 -->
      <UserSelectDrawer v-model="assignVisible" :confirm-loading="assignConfirmLoading" @confirm="onAssignConfirm" />
    </template>
  </PageContainer>
</template>

<style lang="scss" scoped>
.tenant-detail-page {
  --gov-brand: #7c3aed;
  --gov-bg: #f8fafc;
  --gov-border: #e2e8f0;

  overflow-y: auto;
  overflow-x: hidden;
  background: var(--gov-bg);
}

.governance-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 4px;
}

.info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

  .info-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    color: #1e293b;
    font-size: 14px;
    font-weight: 700;
    .el-icon {
      color: var(--gov-brand);
    }
    &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #f1f5f9;
      margin-left: 12px;
    }
  }

  .info-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 24px;
    &.grid-4-cols {
      grid-template-columns: 1fr 1fr 1.5fr;
    }

    .info-item {
      &.full {
        grid-column: 1 / -1;
      }
      .label {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .value {
        font-size: 14px;
        color: #334155;
        font-weight: 500;
        &.mono {
          font-family: ui-monospace, SFMono-Regular, monospace;
        }
        &.copyable {
          cursor: pointer;
          &:hover {
            color: var(--gov-brand);
            text-decoration: underline;
          }
        }
        &.desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
        }
      }
    }
  }
}

.governance-tabs-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 24px 24px;
}

.header-action-stack {
  display: flex;
  gap: 12px;
  .gov-action-btn {
    height: 38px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    &.primary {
      color: var(--gov-brand);
      border-color: #ede9fe;
      background: #f5f3ff;
      &:hover {
        background: #ede9fe;
      }
    }
    &.danger {
      color: #ef4444;
      border-color: #fee2e2;
      background: #ffffff;
      &:hover {
        background: #fef2f2;
      }
    }
    .el-icon {
      margin-right: 6px;
    }
  }
}

.governance-raw-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  &.is-active {
    color: var(--gov-brand);
  }
}
:deep(.el-tabs__active-bar) {
  background-color: var(--gov-brand);
  height: 3px;
  border-radius: 2px;
}
</style>
