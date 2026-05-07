<script setup lang="ts">
import { ref } from "vue"
import { OfficeBuilding, ArrowRight } from "@element-plus/icons-vue"
import type { Tenant } from "@/api/iam/user/type"
import { switchTenantApi } from "@/api/iam/user"
import { ElMessage } from "element-plus"
import { useRouter } from "vue-router"

defineProps<{
  tenants: Tenant[]
}>()

const visible = defineModel<boolean>({ default: false })
const router = useRouter()
const switching = ref(false)
const selectedId = ref<number | null>(null)

const handleSelect = async (tenant: Tenant) => {
  selectedId.value = tenant.id
  switching.value = true
  try {
    await switchTenantApi({ tenant_id: tenant.id })
    ElMessage.success(`欢迎进入：${tenant.name}`)
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
    title="选择工作空间"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    append-to-body
    class="tenant-select-dialog"
  >
    <div class="tenant-select-content">
      <div class="header-desc">检测到您的账号关联了多个治理空间，请选择一个切入点</div>

      <div class="tenant-grid">
        <div
          v-for="(item, index) in tenants"
          :key="item.id"
          class="tenant-card-wrapper"
          :style="{ '--delay': index * 0.1 + 's' }"
        >
          <div class="tenant-card" :class="{ 'is-active': selectedId === item.id }" @click="handleSelect(item)">
            <div class="card-icon-box">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="card-body">
              <div class="tenant-name">{{ item.name }}</div>
              <div class="tenant-meta">
                <span class="code-tag">ID: {{ item.code }}</span>
                <span v-if="item.domain" class="domain-info">{{ item.domain }}</span>
              </div>
            </div>
            <div class="card-arrow">
              <el-icon v-if="selectedId === item.id && switching" class="is-loading"><Loading /></el-icon>
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
  background: rgba(255, 255, 255, 0.9);
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
    margin-bottom: 28px;
    font-weight: 450;
  }
}

.tenant-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  padding: 20px;
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
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-4px) scale(1.01);
    box-shadow:
      0 12px 24px -10px rgba(59, 130, 246, 0.2),
      0 4px 10px -5px rgba(59, 130, 246, 0.1);

    &::before {
      opacity: 1;
    }

    .card-icon-box {
      transform: scale(1.1);
      background: #3b82f6;
      color: #ffffff;
    }

    .arrow-icon {
      transform: translateX(6px);
      color: #3b82f6;
    }
  }

  &.is-active {
    border-color: #3b82f6;
    background: #eff6ff;
    border-width: 2px;
  }

  .card-icon-box {
    width: 52px;
    height: 52px;
    background: #f1f5f9;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #64748b;
    margin-right: 20px;
    transition: all 0.3s;
    z-index: 1;
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.8);
  }

  .card-body {
    flex: 1;
    z-index: 1;
    .tenant-name {
      font-size: 16px;
      font-weight: 750;
      color: #0f172a;
      margin-bottom: 6px;
      letter-spacing: -0.2px;
    }
    .tenant-meta {
      display: flex;
      align-items: center;
      gap: 12px;

      .code-tag {
        font-size: 11px;
        background: #f1f5f9;
        color: #64748b;
        padding: 2px 8px;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-weight: 600;
      }

      .domain-info {
        font-size: 12px;
        color: #94a3b8;
      }
    }
  }

  .card-arrow {
    font-size: 20px;
    color: #cbd5e1;
    z-index: 1;
    transition: all 0.3s;

    .arrow-icon {
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }
}
</style>
