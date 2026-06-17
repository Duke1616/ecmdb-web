<template>
  <div class="execute-target-cell">
    <div class="target-text-group">
      <el-tooltip :content="target" placement="top" :show-after="500">
        <span class="target-main">{{ target }}</span>
      </el-tooltip>
      <span class="target-sep">/</span>
      <el-tooltip :content="handler" placement="top" :show-after="500">
        <span class="target-handler">{{ handler }}</span>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  target: string
  handler: string
}>()
</script>

<style scoped lang="scss">
.execute-target-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4px 0;
}

.target-text-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
  min-width: 0;
  word-break: break-all;
}

.target-main {
  font-weight: 500;
  color: #94a3b8;
}

.target-sep {
  color: #e2e8f0;
  font-weight: 700;
  margin: 0 2px;
}

.target-handler {
  font-weight: 700;
  color: #1e293b;
  font-family: "JetBrains Mono", "Fira Code", monospace;
}
</style>
