<template>
  <div class="search-command-inner">
    <el-input
      v-model="keyword"
      :placeholder="placeholder"
      class="command-input"
      clearable
      @keyup.enter="emit('search')"
      @clear="emit('search')"
    >
      <template #prefix>
        <el-icon class="search-icon"><Search /></el-icon>
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue"

withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: "搜索执行器名称..."
  }
)

const emit = defineEmits<{
  search: []
}>()

const keyword = defineModel<string>("keyword", { default: "" })
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
  width: 280px;
  flex: 0 0 280px;

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

@media (max-width: 768px) {
  .search-command-inner {
    width: 100%;
  }

  .command-input {
    width: 100%;
    min-width: 0;
    max-width: none;
    flex: none;
  }
}
</style>
