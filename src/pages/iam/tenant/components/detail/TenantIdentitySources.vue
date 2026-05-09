<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import {
  ArrowRight,
  Setting,
  Monitor,
  Iphone,
  Promotion,
  Connection,
  Check,
  Close,
  Delete,
  Cpu,
  Rank
} from "@element-plus/icons-vue"
import { listIdentitySourcesApi, deleteIdentitySourceApi, saveIdentitySourceApi } from "@/api/iam/identity-source"
import type { IdentitySourceVO } from "@/api/iam/identity-source/type"
import { ElMessageBox, ElMessage } from "element-plus"

import IdentitySourceDrawer from "./IdentitySourceDrawer.vue"

defineProps<{
  tenantId: number
}>()

// --- 状态管理 ---
const providers = ref<IdentitySourceVO[]>([])
const loading = ref(false)
const activeIndex = ref(0)
const activeProvider = computed(() => providers.value[activeIndex.value])

// --- 弹窗管理 ---
const drawerVisible = ref(false)
const editingData = ref<IdentitySourceVO | undefined>()

const handleAdd = () => {
  editingData.value = undefined
  drawerVisible.value = true
}

const handleEdit = () => {
  editingData.value = activeProvider.value
  drawerVisible.value = true
}

const handleSuccess = () => {
  fetchProviders()
}

// --- 数据加载 ---
const fetchProviders = async () => {
  loading.value = true
  try {
    const res = await listIdentitySourcesApi()
    providers.value = res.data || []
    if (providers.value.length > 0 && activeIndex.value >= providers.value.length) {
      activeIndex.value = 0
    }
  } finally {
    loading.value = false
  }
}

const getProviderIcon = (type: string) => {
  const t = type.toLowerCase()
  if (t === "ldap" || t === "ad") return Monitor
  if (t === "wechat") return Iphone
  if (t === "feishu") return Promotion
  return Connection
}

const getProviderName = (type: string) => {
  const nameMap: Record<string, string> = {
    ldap: "LDAP / AD",
    wechat: "WeCom",
    feishu: "Feishu"
  }
  return nameMap[type.toLowerCase()] || type
}

// --- 操作处理 ---
const handleToggleStatus = async (item: IdentitySourceVO) => {
  try {
    await saveIdentitySourceApi({
      id: item.id,
      name: item.name,
      type: item.type,
      enabled: !item.enabled,
      ldap: item.ldap
    })
    ElMessage.success(`${item.enabled ? "停用" : "启用"}成功`)
    fetchProviders()
  } catch (error) {
    // 错误已由全局拦截器处理
  }
}

const handleDelete = (item: IdentitySourceVO) => {
  ElMessageBox.confirm(`确定要删除身份源 "${item.name}" 吗？此操作不可恢复。`, "风险确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      await deleteIdentitySourceApi(item.id)
      ElMessage.success("删除成功")
      fetchProviders()
    } catch (error) {
      // 错误已由全局拦截器处理
    }
  })
}

onMounted(() => {
  fetchProviders()
})
</script>

<template>
  <div class="tenant-idp-governance" v-loading="loading">
    <div class="governance-header">
      <div class="header-left">
        <div class="title-indicator" />
        <span class="title-text">租户级身份源治理</span>
        <span class="count-badge">{{ providers.length }} 个节点</span>
      </div>
      <div class="header-right">
        <el-button class="manage-action-btn primary" @click="handleAdd">
          <el-icon><Connection /></el-icon>
          <span>集成新协议</span>
        </el-button>
      </div>
    </div>

    <div class="identity-governance-split">
      <div class="governance-nav-rail">
        <div class="rail-stack">
          <div
            v-for="(id, index) in providers"
            :key="id.id"
            class="identity-mini-card"
            :class="{ active: activeIndex === index }"
            @click="activeIndex = index"
          >
            <div class="provider-icon">
              <component :is="getProviderIcon(id.type)" />
            </div>
            <div class="card-info">
              <div class="name">{{ id.name }}</div>
              <div class="type">{{ getProviderName(id.type) }}</div>
            </div>
            <el-icon v-if="activeIndex === index" color="#3b82f6"><ArrowRight /></el-icon>
          </div>

          <el-empty v-if="providers.length === 0" description="暂无集成身份源" :image-size="60" />
        </div>
      </div>

      <div class="governance-insight-panel">
        <template v-if="activeProvider">
          <div class="insight-header">
            <div class="title-group">
              <div class="main-title">{{ activeProvider.name }}</div>
              <div class="sub-text">通过 {{ getProviderName(activeProvider.type) }} 协议与外部目录进行身份同步</div>
            </div>
            <div class="status-capsule" :class="activeProvider.enabled ? 'enabled' : 'disabled'">
              <div class="dot" />
              {{ activeProvider.enabled ? "RUNNING" : "STOPPED" }}
            </div>
          </div>

          <div class="detail-content-scroller">
            <div class="info-section">
              <div class="detail-section-header">
                <el-icon><Cpu /></el-icon>
                <span>基础标识信息</span>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="label">内部标识 ID</div>
                  <div class="value mono">{{ activeProvider.id }}</div>
                </div>
                <div class="info-item">
                  <div class="label">最后同步时间</div>
                  <div class="value">{{ new Date(activeProvider.utime).toLocaleString() }}</div>
                </div>
              </div>
            </div>

            <template v-if="activeProvider.ldap">
              <div class="info-section">
                <div class="detail-section-header">
                  <el-icon><Connection /></el-icon>
                  <span>目录连接参数</span>
                </div>
                <div class="info-grid single">
                  <div class="info-item">
                    <div class="label">连接终结点</div>
                    <div class="value mono">{{ activeProvider.ldap.url }}</div>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <div class="detail-section-header">
                  <el-icon><Rank /></el-icon>
                  <span>搜索与鉴权配置</span>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="label">搜索基准</div>
                    <div class="value mono">{{ activeProvider.ldap.base_dn }}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">绑定账号</div>
                    <div class="value mono">{{ activeProvider.ldap.bind_dn }}</div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="action-footer">
            <el-button link class="footer-btn danger" :icon="Delete" @click="handleDelete(activeProvider)"
              >删除配置</el-button
            >
            <el-button link class="footer-btn primary" :icon="Setting" @click="handleEdit">修改配置参数</el-button>
            <el-button
              class="footer-btn outline"
              :icon="activeProvider.enabled ? Close : Check"
              @click="handleToggleStatus(activeProvider)"
            >
              {{ activeProvider.enabled ? "停用集成" : "开启集成" }}
            </el-button>
          </div>
        </template>
        <el-empty v-else description="请选择左侧身份源" />
      </div>
    </div>

    <IdentitySourceDrawer v-model="drawerVisible" :initial-data="editingData" @success="handleSuccess" />
  </div>
</template>

<style lang="scss" scoped>
.tenant-idp-governance {
  background: #fcfdfe;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.governance-header {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .title-indicator {
      width: 4px;
      height: 24px;
      background: linear-gradient(to bottom, #3b82f6, #2563eb);
      border-radius: 2px;
    }

    .title-text {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.01em;
    }

    .count-badge {
      padding: 2px 10px;
      background: #eff6ff;
      color: #3b82f6;
      border: 1px solid #dbeafe;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 700;
    }
  }

  .manage-action-btn {
    &.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      color: white;
      font-weight: 600;
      padding: 0 20px;
      height: 38px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
      }
    }
  }
}

.identity-governance-split {
  display: flex;
  height: 640px;
}

/* 左侧导航轨 */
.governance-nav-rail {
  width: 260px;
  background: #f8fafc;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  overflow-y: auto;

  .rail-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .identity-mini-card {
    position: relative;
    padding: 16px;
    background: #ffffff;
    border: 1px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 12px;

    .provider-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: #f1f5f9;
      color: #64748b;
      font-size: 18px;
      transition: all 0.2s;
    }

    .card-info {
      flex: 1;
      min-width: 0;
      .name {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .type {
        font-size: 11px;
        color: #94a3b8;
        font-weight: 500;
      }
    }

    .arrow {
      font-size: 12px;
      color: #cbd5e1;
      opacity: 0;
      transition: all 0.2s;
    }

    &:hover {
      background: #fcfdfe;
      border-color: #e2e8f0;
      transform: translateX(4px);
      .arrow {
        opacity: 1;
      }
    }

    &.active {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 8px 16px rgba(59, 130, 246, 0.08);

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 20%;
        bottom: 20%;
        width: 3px;
        background: #3b82f6;
        border-radius: 0 4px 4px 0;
      }

      .provider-icon {
        color: #3b82f6;
        background: #eff6ff;
      }
      .card-info .name {
        color: #1e293b;
      }
      .arrow {
        opacity: 1;
        color: #3b82f6;
      }
    }
  }
}

/* 右侧详情面板 */
.governance-insight-panel {
  flex: 1;
  padding: 32px 40px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;

  .insight-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    flex-shrink: 0;

    .title-group {
      .main-title {
        font-size: 20px;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 4px;
        letter-spacing: -0.02em;
      }
      .sub-text {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }
    }

    .status-capsule {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      &.enabled {
        background: #ecfdf5;
        color: #059669;
        .dot {
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
      }
      &.disabled {
        background: #f8fafc;
        color: #64748b;
        .dot {
          background: #94a3b8;
        }
      }
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
    }
  }

  .detail-content-scroller {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;

    /* Custom Scrollbar */
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 4px;
    }
  }

  .info-section {
    margin-bottom: 24px;

    .detail-section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f8fafc;
      border-left: 3px solid #3b82f6;
      border-radius: 4px;
      margin-bottom: 16px;

      .el-icon {
        font-size: 15px;
        color: #3b82f6;
      }
      span {
        font-size: 13px;
        font-weight: 700;
        color: #475569;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      padding: 0 12px;

      &.single {
        grid-template-columns: 1fr;
      }

      .info-item {
        .label {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .value {
          font-size: 14px;
          color: #334155;
          font-weight: 500;
          &.mono {
            font-family: ui-monospace, SFMono-Regular, monospace;
            background: #f1f5f9;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 13px;
            display: inline-block;
          }
        }
      }
    }
  }

  .action-footer {
    margin-top: auto;
    padding-top: 24px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;

    .footer-btn {
      height: 38px;
      padding: 0 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;

      &.danger {
        color: #ef4444;
        &:hover {
          background: #fef2f2;
        }
      }
      &.primary {
        background: #eff6ff;
        color: #3b82f6;
        &:hover {
          background: #dbeafe;
        }
      }
      &.outline {
        background: #ffffff;
        color: #475569;
        border: 1px solid #e2e8f0;
        &:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
      }
    }
  }
}
</style>
