<script setup lang="ts">
import { onMounted } from "vue"
import { Edit, User } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import UserDialog from "./components/UserDialog.vue"
import { useUserStore } from "@/pinia/stores/user"

// Composables
import { useUserDetail } from "./composables/useUserDetail"
import { useUserDisplayItems } from "./composables/useUserDisplayItems"
// Components
import AuthGovernance from "./components/detail/AuthGovernance.vue"
import StatusStrip from "@/common/components/Governance/StatusStrip.vue"
import InfoCard from "@/common/components/Governance/InfoCard.vue"

const userStore = useUserStore()

const {
  userInfo,
  loading: detailLoading,
  editVisible,
  loadDetail,
  handleEdit,
  handleEditSuccess,
  copyText
} = useUserDetail()

const { statusItems, infoItems } = useUserDisplayItems(userInfo)

// 初始加载详情
onMounted(() => {
  if (userStore.username) {
    loadDetail(userStore.username)
  }
})
</script>

<template>
  <PageContainer v-loading="detailLoading" class="user-profile-page">
    <template v-if="userInfo">
      <ManagerHeader :title="userInfo.nickname || userInfo.username" :subtitle="'个人中心'" :show-back-button="false">
        <template #actions>
          <div class="header-action-stack">
            <el-button class="gov-action-btn primary" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              <span>修改资料</span>
            </el-button>
          </div>
        </template>
      </ManagerHeader>

      <div class="governance-body">
        <!-- 1. 身份安全状态条 -->
        <StatusStrip :items="statusItems" />

        <!-- 2. 身份实证资料卡 -->
        <InfoCard title="我的身份实证资料" :icon="User" :items="infoItems" @copy="copyText" />

        <!-- 3. 治理内容区 -->
        <AuthGovernance :user="userInfo" @refresh="() => loadDetail(userStore.username)" />
      </div>

      <!-- 编辑自治弹窗 -->
      <UserDialog v-model="editVisible" :user-id="userInfo?.id" @success="handleEditSuccess" />
    </template>
  </PageContainer>
</template>

<style lang="scss" scoped>
.user-profile-page {
  --gov-brand: #3b82f6;
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
