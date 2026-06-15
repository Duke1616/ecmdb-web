<template>
  <div class="search-command-inner">
    <el-input v-model="keyword" placeholder="搜索模型名称或唯一标识..." class="command-input" clearable>
      <template #prefix>
        <el-icon class="search-icon"><Search /></el-icon>
      </template>
    </el-input>

    <div class="divider" />

    <el-select v-model="status" placeholder="模型状态" class="command-select">
      <el-option label="所有状态" value="all" />
      <el-option label="启用中" value="open" />
      <el-option label="已停用" value="close" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import type { ModelFilterStatus } from "../utils/modelDisplay"
import { Search } from "@element-plus/icons-vue"

const keyword = defineModel<string>("keyword", { default: "" })
const status = defineModel<ModelFilterStatus>("status", { default: "all" })
</script>

<style lang="scss" scoped>
.search-command-inner {
  display: inline-flex;
  align-items: center;
  width: auto;
  max-width: 100%;
  height: 38px;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus-within {
    border-color: #0ea5e9;
  }
}

.command-input {
  width: 260px;
  flex: 0 0 260px;

  :deep(.el-input__wrapper) {
    padding: 0;
    background: transparent;
    box-shadow: none !important;
  }
}

.search-icon {
  color: #94a3b8;
  font-size: 16px;
}

.divider {
  width: 1px;
  height: 16px;
  margin: 0 8px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.command-select {
  width: 124px;
  flex: 0 0 124px;

  :deep(.el-select__wrapper) {
    padding: 0 8px;
    background: transparent;
    box-shadow: none !important;

    .el-select__placeholder {
      color: #64748b;
      font-size: 13px;
    }
  }
}

@media (max-width: 768px) {
  .search-command-inner {
    align-items: flex-start;
    flex-direction: column;
    width: 100%;
    height: auto;
    padding: 8px 12px;
    gap: 8px;
  }

  .command-input,
  .command-select {
    width: 100%;
    min-width: 0;
    max-width: none;
    flex: none;
  }

  .divider {
    display: none;
  }
}
</style>
