<template>
  <section class="access-lock">
    <div class="lock-visual">
      <el-icon><Lock /></el-icon>
    </div>
    <div class="lock-copy">
      <h2>执行资源池只允许在系统租户空间配置</h2>
      <p>
        当前空间是 {{ currentTenantName }}。资源池会影响任务执行入口、Handler 路由和租户授权，业务空间只消费已授权能力。
      </p>
      <div class="lock-actions">
        <el-button v-if="systemTenant" type="primary" @click="$emit('switch')">
          <el-icon><Switch /></el-icon>
          切换到系统空间
        </el-button>
        <span v-else class="subtle-note">当前账号没有可切换的系统租户空间</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Lock, Switch } from "@element-plus/icons-vue"
import type { Tenant } from "@/api/iam/user/type"

defineProps<{
  currentTenantName: string
  systemTenant?: Tenant
}>()

defineEmits<{
  switch: []
}>()
</script>

<style scoped lang="scss">
.access-lock {
  min-height: 360px;
  display: grid;
  grid-template-columns: 112px minmax(0, 680px);
  align-items: center;
  gap: 28px;
  padding: 40px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.06), transparent 42%), #ffffff;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
}

.lock-visual {
  width: 96px;
  height: 96px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 38px;
}

.lock-copy {
  min-width: 0;

  h2 {
    margin: 0 0 10px;
    color: #0f172a;
    font-size: 24px;
    line-height: 1.35;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: #526174;
    font-size: 14px;
    line-height: 1.8;
  }
}

.lock-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
}

.subtle-note {
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 760px) {
  .access-lock {
    grid-template-columns: 1fr;
    padding: 24px;
  }
}
</style>
