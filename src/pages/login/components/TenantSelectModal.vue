<script setup lang="ts">
import { ref } from "vue"
import { OfficeBuilding, ArrowRight, Loading, Timer } from "@element-plus/icons-vue"
import type { Tenant } from "@/api/iam/user/type"
import { switchTenantApi } from "@/api/iam/tenant"
import { ElMessage } from "element-plus"
import { useRouter } from "vue-router"
import { getTenantDisplayName } from "@/common/utils/tenant-display"

export interface SelectableTenant extends Tenant {
  status?: number
  audit_status?: "pending" | "approved" | "rejected"
}

const props = defineProps<{
  tenants: SelectableTenant[]
  username?: string
  title?: string
  description?: string
  showClose?: boolean
}>()

// NOTE: 该组件为纯 UI 弹窗状态控制组件，visible 状态需与父组件双向同步
const visible = defineModel<boolean>({ default: false })
const router = useRouter()
const switching = ref(false)
const selectedId = ref<number | null>(null)

const handleSelect = async (tenant: SelectableTenant) => {
  if (tenant.audit_status === "pending") {
    ElMessage.warning("该租户入驻申请正在管理员审批中，审批通过后方可进入")
    return
  }
  selectedId.value = tenant.id
  switching.value = true
  try {
    await switchTenantApi(tenant.id)
    ElMessage.success(`欢迎进入：${getTenantDisplayName(tenant, props.username)}`)
    visible.value = false
    router.push("/")
  } finally {
    switching.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title || '选择工作空间'"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="showClose ?? false"
    append-to-body
    class="tenant-select-dialog"
  >
    <div class="tenant-select-content">
      <div class="header-desc">
        {{ description || "检测到您的账号关联了多个治理空间，请选择一个切入点" }}
      </div>

      <div class="tenant-grid">
        <div
          v-for="(item, index) in tenants"
          :key="item.id"
          class="tenant-card-wrapper"
          :style="{ '--delay': index * 0.1 + 's' }"
        >
          <div
            class="tenant-card"
            :class="{
              'is-active': selectedId === item.id,
              'is-pending': item.audit_status === 'pending'
            }"
            @click="handleSelect(item)"
          >
            <div class="card-icon-box" :class="{ 'is-pending-box': item.audit_status === 'pending' }">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="card-body">
              <div class="tenant-name-row">
                <span class="tenant-name">{{ getTenantDisplayName(item, props.username) }}</span>
                <span v-if="item.audit_status === 'pending'" class="pending-tag">
                  <el-icon class="mr-1"><Timer /></el-icon> 审批中
                </span>
              </div>
              <div class="tenant-meta">
                <span class="code-tag">ID: {{ item.code }}</span>
                <span v-if="item.domain" class="domain-info">{{ item.domain }}</span>
              </div>
            </div>
            <div class="card-arrow">
              <el-icon v-if="selectedId === item.id && switching" class="is-loading"><Loading /></el-icon>
              <span v-else-if="item.audit_status === 'pending'" class="pending-text">等待审批</span>
              <el-icon v-else class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style lang="scss">
.tenant-select-dialog {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  .el-dialog__header {
    margin-right: 0;
    padding: 32px 32px 12px;
    .el-dialog__title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
  .el-dialog__body {
    padding: 0 32px 40px;
  }
}

.tenant-select-content {
  .header-desc {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 24px;
    font-weight: 450;
    line-height: 1.5;
  }
}

.tenant-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tenant-card-wrapper {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

.tenant-card {
  display: flex;
  align-items: center;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover:not(.is-pending) {
    border-color: #10b981;
    transform: translateY(-3px) scale(1.01);
    box-shadow:
      0 12px 24px -10px rgba(16, 185, 129, 0.25),
      0 4px 10px -5px rgba(16, 185, 129, 0.1);

    &::before {
      opacity: 1;
    }

    .card-icon-box {
      transform: scale(1.08);
      background: #10b981;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      border: none;
    }

    .arrow-icon {
      transform: translateX(6px);
      color: #10b981;
    }
  }

  &.is-active {
    border-color: #10b981;
    background: #f0fdf4;
    border-width: 2px;
  }

  &.is-pending {
    background: #fafafa;
    border-style: dashed;
    border-color: #e2e8f0;
    cursor: not-allowed;
    opacity: 0.9;

    &:hover {
      border-color: #f59e0b;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
    }
  }

  .card-icon-box {
    width: 48px;
    height: 48px;
    background: #f8fafc;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #64748b;
    margin-right: 18px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 1;
    border: 1px solid #e2e8f0;
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.8);

    &.is-pending-box {
      background: #fffbeb;
      color: #d97706;
      border-color: #fef3c7;
    }
  }

  .card-body {
    flex: 1;
    z-index: 1;

    .tenant-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .tenant-name {
      font-size: 15px;
      font-weight: 750;
      color: #0f172a;
      letter-spacing: -0.2px;
    }

    .pending-tag {
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      color: #d97706;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 1px 7px;
      border-radius: 6px;
    }

    .tenant-meta {
      display: flex;
      align-items: center;
      gap: 12px;

      .code-tag {
        font-size: 11px;
        background: #f8fafc;
        color: #64748b;
        padding: 2px 8px;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-weight: 600;
        border: 1px solid #e2e8f0;
      }

      .domain-info {
        font-size: 12px;
        color: #94a3b8;
      }
    }
  }

  .card-arrow {
    font-size: 18px;
    color: #cbd5e1;
    z-index: 1;
    transition: all 0.3s;

    .arrow-icon {
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .pending-text {
      font-size: 12px;
      font-weight: 600;
      color: #d97706;
    }
  }
}
</style>
