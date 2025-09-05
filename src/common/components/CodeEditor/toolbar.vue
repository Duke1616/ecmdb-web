<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="toolbar">
    <div class="toolbar-content">
      <!-- 主题选择 -->
      <div class="toolbar-item">
        <label class="toolbar-label">主题</label>
        <el-select
          v-model="localConfig.theme"
          :disabled="disabled"
          placeholder="选择主题"
          size="small"
          class="toolbar-select"
          :teleported="false"
          @change="handleThemeChange"
        >
          <el-option v-for="option in ['default', ...themes]" :key="option" :label="option" :value="option" />
        </el-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, watch } from "vue"

interface Config {
  theme: string
  disabled: boolean // 禁用输入
  autofocus: boolean // 自动聚焦
  indentWithTab: boolean // 使用制表符缩进
  tabSize: number // TODO 暂未实现，tabSize 用于控制缩进的空格数
}

// 定义 Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  config: {
    type: Object as PropType<Config>,
    required: true
  },
  themes: {
    type: Array as PropType<Array<string>>,
    required: true
  }
})

const localConfig = ref<Config>(props.config)

watch(
  () => props.config,
  () => {
    localConfig.value = props.config
  },
  { immediate: true }
)

// 定义 Emits
const emit = defineEmits(["theme"])

// 处理主题切换事件
const handleThemeChange = () => {
  emit("theme", localConfig.value.theme)
}
</script>

<style lang="scss" scoped>
.toolbar {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.toolbar-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.toolbar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.toolbar-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
  min-width: fit-content;
}

.toolbar-select {
  min-width: 120px;

  :deep(.el-input__wrapper) {
    border-radius: 6px;
    border: 1px solid #d1d5db;
    box-shadow: none;
    transition: all 0.2s ease;

    &:hover {
      border-color: #9ca3af;
    }

    &.is-focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }
}


// 响应式设计
@media (max-width: 768px) {
  .toolbar-content {
    gap: 12px;
  }

  .toolbar-item {
    gap: 6px;
  }

  .toolbar-select {
    min-width: 100px;
  }
}
</style>
