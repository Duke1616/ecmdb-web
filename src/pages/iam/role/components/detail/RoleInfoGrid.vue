<script setup lang="ts">
import { CopyDocument } from "@element-plus/icons-vue"
import type { Role } from "@/api/iam/role/type"

defineProps<{
  role: Role
}>()

const emit = defineEmits<{
  copy: [text: string]
}>()
</script>

<template>
  <div class="info-grid-card">
    <div class="grid-section">
      <div class="section-title">
        <span class="dot" />
        基础身份资产
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">角色标识 (Code)</div>
          <div class="value clickable" @click="emit('copy', role.code)">
            <code>{{ role.code }}</code>
            <el-icon class="copy-icon"><CopyDocument /></el-icon>
          </div>
        </div>
        <div class="info-item">
          <div class="label">内部编号</div>
          <div class="value">#{{ role.id }}</div>
        </div>
        <div class="info-item full-width">
          <div class="label">描述信息</div>
          <div class="value message-box">
            {{ role.desc || "此角色决定了主体的核心访问边界及资源操作权限。" }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.info-grid-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;

  .grid-section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;

      .dot {
        width: 4px;
        height: 14px;
        background: #6366f1;
        border-radius: 2px;
      }
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px 40px;

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &.full-width {
        grid-column: span 2;
      }

      .label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .value {
        font-size: 13px;
        color: #1e293b;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;

        &.clickable {
          cursor: pointer;
          &:hover {
            color: #6366f1;
            .copy-icon {
              opacity: 1;
            }
          }
        }

        code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          color: #475569;
        }

        .copy-icon {
          font-size: 14px;
          color: #94a3b8;
          opacity: 0.6;
          transition: all 0.2s;
        }

        &.message-box {
          line-height: 1.6;
          color: #475569;
          font-weight: 400;
          background: #fbfcfd;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }
      }
    }
  }
}
</style>
