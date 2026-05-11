<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"
import { listJoinRequestsApi } from "@/api/iam/invitation"
import { Operation } from "@element-plus/icons-vue"

const router = useRouter()
const userStore = useUserStore()
const pendingCount = ref(0)
const loading = ref(false)

/** 获取待审批数量 */
const fetchPendingCount = async () => {
  if (!userStore.currentTenantId) return
  loading.value = true
  try {
    const { data } = await listJoinRequestsApi({
      offset: 0,
      limit: 1,
      tenant_id: userStore.currentTenantId
    })
    pendingCount.value = data.total
  } catch (error) {
    console.error("获取审批数量失败:", error)
  } finally {
    loading.value = false
  }
}

/** 监听租户切换，刷新数据 */
watch(
  () => userStore.currentTenantId,
  () => {
    fetchPendingCount()
  },
  { immediate: true }
)

/** 跳转到治理门户 */
const goToGovernancePage = () => {
  router.push("/governance")
}

onMounted(() => {
  fetchPendingCount()
})

// 为外部使用提供刷新方法
defineExpose({
  refresh: fetchPendingCount
})
</script>

<template>
  <div class="governance-container">
    <el-tooltip effect="dark" content="治理工作台" placement="bottom">
      <div class="governance-trigger" :class="{ 'has-count': pendingCount > 0 }" @click="goToGovernancePage">
        <el-badge :value="pendingCount" :hidden="pendingCount === 0" :max="99" class="badge-item">
          <el-icon :size="20"><Operation /></el-icon>
        </el-badge>
      </div>
    </el-tooltip>
  </div>
</template>

<style lang="scss">
.governance-popover {
  padding: 0 !important;
  border-radius: 12px !important;
  overflow: hidden;
  border: 1px solid #e2e8f0 !important;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
}
</style>

<style lang="scss" scoped>
.governance-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.governance-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  cursor: pointer;
  color: #64748b;
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: #f1f5f9;
    color: #3b82f6;
  }

  &.has-count {
    color: #1e293b;
  }

  .badge-item {
    display: flex;
    align-items: center;
    justify-content: center;
    :deep(.el-badge__content) {
      top: 4px;
      right: 4px;
      border: 2px solid #ffffff;
      font-weight: 700;
      background-color: #ef4444;
    }
  }
}

.governance-panel {
  min-height: 100px;

  .panel-header {
    padding: 16px 20px;
    background: #ffffff;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .title {
        font-size: 15px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.01em;
      }

      .subtitle {
        font-size: 11px;
        color: #94a3b8;
      }
    }

    .tenant-tag {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  .panel-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .task-item {
      display: flex;
      align-items: center;
      padding: 14px 12px;
      gap: 14px;
      cursor: pointer;
      border-radius: 10px;
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        background: #f8fafc;
        .arrow-icon {
          transform: translateX(4px);
          opacity: 1;
        }
        .task-icon {
          transform: scale(1.05);
        }
      }

      .task-icon {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
        transition: transform 0.2s ease;

        &.approval {
          background: #eff6ff;
          color: #3b82f6;
          border: 1px solid #dbeafe;
        }

        &.invitation {
          background: #f0fdf4;
          color: #22c55e;
          border: 1px solid #dcfce7;
        }
      }

      .task-content {
        flex: 1;
        min-width: 0;

        .task-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .task-desc {
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          .highlight {
            color: #ef4444;
            font-weight: 800;
            margin: 0 2px;
          }
        }
      }

      .arrow-icon {
        font-size: 16px;
        color: #cbd5e1;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }
  }

  .panel-footer {
    margin: 4px 12px 12px;
    padding: 14px;
    text-align: center;
    background: #f1f5f9;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s;

    &:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
  }
}
</style>
