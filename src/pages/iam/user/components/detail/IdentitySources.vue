<script setup lang="ts">
import { ArrowRight, Collection, InfoFilled, Setting, Monitor, Iphone, Promotion } from "@element-plus/icons-vue"
import { toRefs } from "vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { User } from "@/api/iam/user/type"
import { useIdentityManage } from "../../composables/useIdentityManage"
import IdentityManageDialog from "./IdentityManageDialog.vue"

const props = defineProps<{
  user: User
}>()

const emit = defineEmits<{
  (e: "refresh"): void
}>()

// --- 逻辑抽离与解构 ---
const { user } = toRefs(props)
const {
  manageVisible,
  submitting,
  activeIndex,
  manageForm,
  filteredIdentities,
  activeIdentity,
  getProviderName,
  getIdentityId,
  handleOpenManage,
  handleSaveManage,
  handleUnbind
} = useIdentityManage(user, emit)

/**
 * 获取身份源对应图标
 */
const getProviderIcon = (p: string) => {
  const iconMap: Record<string, any> = {
    ldap: Monitor,
    wechat: Iphone,
    feishu: Promotion
  }
  return iconMap[p.toLowerCase()] || Collection
}
</script>

<template>
  <div class="governance-container">
    <!-- 1. 标准化顶部治理栏 (1:1 还原) -->
    <div class="governance-header">
      <div class="header-left">
        <div class="title-indicator" />
        <span class="title-text">关联身份源治理</span>
        <span class="count-badge">{{ filteredIdentities.length }}</span>
      </div>
      <div class="header-right">
        <el-button class="manage-action-btn" @click="handleOpenManage">
          <el-icon><Setting /></el-icon>
          <span>治理身份源</span>
        </el-button>
      </div>
    </div>

    <!-- 2. 内容分栏区域 -->
    <div class="identity-governance-split">
      <!-- 左侧：身份源卡片导航 -->
      <div class="governance-nav-rail">
        <div class="rail-stack">
          <div
            v-for="(id, index) in filteredIdentities"
            :key="id.provider"
            class="identity-mini-card"
            :class="{ active: activeIndex === index }"
            @click="activeIndex = index"
          >
            <div class="card-indicator" />
            <div class="card-content">
              <el-icon class="provider-icon">
                <component :is="getProviderIcon(id.provider)" />
              </el-icon>
              <AssetIdentityCell :title="getProviderName(id.provider)" :tag-style="false" />
            </div>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </div>

          <div v-if="filteredIdentities.length === 0" class="rail-empty">
            <el-icon><Collection /></el-icon>
            <p>暂无身份关联数据</p>
          </div>
        </div>
      </div>

      <!-- 右侧：详情洞察面板 -->
      <div class="governance-insight-panel">
        <template v-if="activeIdentity">
          <div class="insight-header">
            <div class="insight-title">映射详情</div>
            <div class="provider-tag">{{ getProviderName(activeIdentity.provider) }}</div>
          </div>

          <div class="attribute-list">
            <div class="attr-item">
              <div class="label">外部关联唯一标识 (ID / DN)</div>
              <div class="value mono">
                {{ getIdentityId(activeIdentity) }}
              </div>
            </div>

            <div class="attribute-row">
              <div class="attr-item">
                <div class="label">协议标准</div>
                <div class="value">
                  {{ activeIdentity.provider.toLowerCase() === "ldap" ? "RFC 4511 (LDAPv3)" : "OAuth 2.0 / OIDC" }}
                </div>
              </div>

              <div class="attr-item">
                <div class="label">同步状态</div>
                <div class="value success"><span class="dot" /> 实时生效中</div>
              </div>
            </div>
          </div>

          <!-- 底部操作区 -->
          <div v-if="activeIdentity.provider.toLowerCase() !== 'ldap'" class="action-footer">
            <el-button link type="danger" class="unbind-btn" @click="handleUnbind"> 解除账号关联 </el-button>
          </div>
          <div v-else class="action-footer-info">
            <el-icon><InfoFilled /></el-icon>
            <span>AD 域身份受目录同步保护，禁止手动解绑</span>
          </div>
        </template>

        <div v-else class="insight-placeholder">
          <el-empty description="选择左侧身份源查看详情" />
        </div>
      </div>
    </div>
  </div>

  <!-- 统一治理弹窗子组件 -->
  <IdentityManageDialog v-model="manageVisible" :form="manageForm" :loading="submitting" @confirm="handleSaveManage" />
</template>

<style lang="scss" scoped>
.governance-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.governance-header {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .title-indicator {
      width: 5px;
      height: 26px;
      background: #3b82f6;
      border-radius: 999px;
    }

    .title-text {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }

    .count-badge {
      min-width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e5edf5;
      padding: 0 8px;
      border-radius: 999px;
    }
  }

  .manage-action-btn {
    height: 34px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid #3b82f6;
    background: #3b82f6;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;

    .el-icon {
      margin-right: 6px;
    }

    &:hover {
      background: #2563eb;
      border-color: #2563eb;
    }
  }
}

.identity-governance-split {
  display: flex;
  min-height: 200px;
  background: transparent;
}

/* 左侧导航轨 - 纯净版 */
.governance-nav-rail {
  width: 200px;
  background: #f8fafc;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;

  .rail-stack {
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .identity-mini-card {
    position: relative;
    padding: 12px 14px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-indicator {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      background: #3b82f6;
      border-radius: 0 4px 4px 0;
      transition: height 0.3s ease;
    }

    .card-content {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .provider-icon {
      font-size: 16px;
      color: #94a3b8;
      transition: color 0.2s;
    }

    :deep(.asset-identity-cell) {
      .title {
        font-size: 13px;
        font-weight: 500;
        color: #64748b;
      }
    }

    .arrow {
      font-size: 12px;
      color: #cbd5e1;
      opacity: 0;
      transition: all 0.2s;
    }

    &:hover {
      background: #f1f5f9;
      .arrow {
        opacity: 1;
      }
      .provider-icon {
        color: #64748b;
      }
    }

    &.active {
      background: #ffffff;
      border-color: #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

      .card-indicator {
        height: 18px;
      }

      .provider-icon {
        color: #3b82f6;
      }

      :deep(.asset-identity-cell) {
        .title {
          font-weight: 700;
          color: #1e293b;
        }
      }

      .arrow {
        opacity: 1;
        color: #3b82f6;
        transform: translateX(2px);
      }
    }
  }

  .rail-empty {
    padding: 30px 10px;
    text-align: center;
    color: #94a3b8;
    .el-icon {
      font-size: 20px;
      margin-bottom: 4px;
    }
    p {
      font-size: 12px;
    }
  }
}

/* 右侧洞察面板 - 紧凑版 */
.governance-insight-panel {
  flex: 1;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;

  .insight-header {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;

    &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #f1f5f9;
      order: 2;
    }

    .insight-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      order: 1;
    }

    .provider-tag {
      font-size: 10px;
      font-weight: 800;
      color: #3b82f6;
      background: #eff6ff;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.05em;
      order: 3;
    }
  }

  .attribute-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;

    .attribute-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .attr-item {
      .label {
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        margin-bottom: 8px;
        letter-spacing: 0.02em;
      }
      .value {
        font-size: 13px;
        color: #334155;
        font-weight: 600;
        line-height: 1.5;

        &.mono {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
          background: #f8fafc;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          word-break: break-all;
          color: #475569;
          font-size: 12px;
        }

        &.success {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #10b981;
          .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
          }
        }
      }
    }
  }

  .action-footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;

    .unbind-btn {
      font-weight: 600;
      font-size: 12px;
      color: #94a3b8;
      &:hover {
        color: #ef4444;
      }
    }
  }

  .action-footer-info {
    margin-top: 32px;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #64748b;
    border: 1px solid #f1f5f9;

    .el-icon {
      font-size: 14px;
      color: #3b82f6;
    }
  }

  .insight-placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
