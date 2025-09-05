<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="toolbar">
    <div class="toolbar-content">
      <!-- 语言选择 -->
      <div class="toolbar-item" v-if="isCreate">
        <label class="toolbar-label">语言</label>
        <el-select
          name="language"
          id="language"
          v-model="localConfig.language"
          :disabled="disabled"
          placeholder="选择语言"
          size="small"
          @change="handleSelectLanguage"
          class="toolbar-select"
          :teleported="false"
        >
          <el-option v-for="option in languages" :key="option" :label="option" :value="option" />
        </el-select>
      </div>
      
      <!-- 语言显示（编辑模式） -->
      <div class="toolbar-item" v-if="!isCreate">
        <label class="toolbar-label">语言</label>
        <div class="language-display">{{ props.language }}</div>
      </div>
      
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
        >
          <el-option v-for="option in ['default', ...themes]" :key="option" :label="option" :value="option" />
        </el-select>
      </div>
      
      <!-- 编辑开关 -->
      <div class="toolbar-item">
        <label class="toolbar-label">禁止编辑</label>
        <el-switch v-model="localConfig.disabled" size="small" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, watch } from "vue"

interface Config {
  language: string
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
  languages: {
    type: Array as PropType<Array<string>>,
    required: true
  },
  themes: {
    type: Array as PropType<Array<string>>,
    required: true
  },

  language: {
    type: String as PropType<string>,
    required: true
  },
  isCreate: {
    type: Boolean as PropType<boolean>,
    default: false
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
const emit = defineEmits(["language"])

// 处理语言选择事件
const handleSelectLanguage = () => {
  emit("language", localConfig.value.language)
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

.language-display {
  padding: 4px 8px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

:deep(.el-switch) {
  --el-switch-on-color: #3b82f6;
  --el-switch-off-color: #d1d5db;
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
