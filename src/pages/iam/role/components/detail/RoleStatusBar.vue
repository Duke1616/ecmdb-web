<script setup lang="ts">
import type { Role } from "@/api/iam/role/type"
import { RoleType } from "@/api/iam/role/type"
import { User } from "@element-plus/icons-vue"

defineProps<{
  role: Role
}>()
</script>

<template>
  <div class="status-bar-card">
    <div class="status-item">
      <div class="label">账户类型</div>
      <div class="content">
        <el-tag
          :type="role.type === RoleType.SYSTEM ? 'info' : 'success'"
          size="small"
          effect="plain"
          class="status-tag"
        >
          <el-icon><ShieldCheck /></el-icon>
          <span>{{ role.type === RoleType.SYSTEM ? "内置角色" : "租户私有" }}</span>
        </el-tag>
      </div>
    </div>

    <div class="divider" />

    <div class="status-item">
      <div class="label">主体类型</div>
      <div class="content">
        <el-tag type="warning" size="small" effect="plain" class="status-tag">
          <el-icon><User /></el-icon>
          <span>RBAC 主体</span>
        </el-tag>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-bar-card {
  display: flex;
  align-items: center;
  gap: 32px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 20px;

  .status-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .content {
      display: flex;
      align-items: center;

      .status-tag {
        height: 24px;
        padding: 0 8px;
        border-radius: 6px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 5px;
        border-color: #f1f5f9;

        .el-icon {
          font-size: 13px;
        }
      }
    }
  }

  .divider {
    width: 1px;
    height: 24px;
    background: #f1f5f9;
  }
}
</style>
