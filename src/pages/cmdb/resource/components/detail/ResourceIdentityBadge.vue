<template>
  <div class="resource-identity">
    <div class="identity-badge">
      <span class="badge-label">资源名称</span>
      <code class="identity-code">{{ name || "-" }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<style lang="scss" scoped>
.resource-identity {
  .identity-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    transition: border-color 0.2s ease;

    .badge-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.5px;
    }

    .identity-code {
      font-family: var(--font-mono, "Monaco", "Menlo", "Ubuntu Mono", monospace);
      font-size: 13px;
      font-weight: 700;
      color: #1e40af;
      background: #ffffff;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #dbeafe;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
