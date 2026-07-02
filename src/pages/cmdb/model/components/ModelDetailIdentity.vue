<template>
  <div class="model-detail-identity">
    <div class="identity-badge">
      <span class="badge-label">唯一标识</span>
      <code class="identity-code">{{ uid || "-" }}</code>
      <el-tag v-if="builtin" size="small" type="warning" class="builtin-tag">内置</el-tag>
    </div>
    <h2 class="model-name">{{ name || "模型详情" }}</h2>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  uid: string
  name: string
  builtin: boolean
}>()
</script>

<style lang="scss" scoped>
.model-detail-identity {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.identity-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.badge-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.identity-code {
  max-width: 220px;
  overflow: hidden;
  color: #0369a1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.builtin-tag {
  border-radius: 999px;
  font-weight: 700;
}

.model-name {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .model-detail-identity {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
