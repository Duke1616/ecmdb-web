<template>
  <div class="variable-input-container">
    <div class="input-header">
      <div class="label-box">
        <span class="label-text">{{ label }}</span>
      </div>
    </div>

    <div class="input-wrapper" :class="{ 'is-focus': isFocus }">
      <el-input
        v-model="internalValue"
        :placeholder="placeholder"
        @focus="isFocus = true"
        @blur="isFocus = false"
        class="custom-inner-input"
      >
        <template #prefix>
          <el-icon class="input-prefix-icon"><ChatLineSquare /></el-icon>
        </template>
        <template #suffix>
          <el-dropdown trigger="click" @command="handleInsert">
            <div class="variable-add-btn">
              <el-icon><Plus /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="variable-dropdown">
                <el-dropdown-item v-for="v in variables" :key="v.key" :command="v.key">
                  <div class="dropdown-item-content">
                    <span class="item-label">{{ v.label }}</span>
                    <span class="item-key" v-text="formatVariable(v.key)" />
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * NOTE: 变量增强型输入组件
 * 专门用于支持 {{variable}} 语法的动态模板输入，集成快捷插入与可视化引导
 */
import { ref } from "vue"
import { ChatLineSquare, Plus } from "@element-plus/icons-vue"

interface VariableDefinition {
  key: string
  label: string
}

defineProps<{
  label: string
  placeholder?: string
  variables: VariableDefinition[]
}>()

const internalValue = defineModel<string>()
const isFocus = ref(false)

/**
 * 格式化变量显示
 * @param key 变量名
 */
const formatVariable = (key: string) => `{{${key}}}`

const handleInsert = (key: string) => {
  const variable = `{{${key}}}`
  if (!internalValue.value) {
    internalValue.value = variable
  } else {
    // 简单的追加，后续可以优化为在光标处插入
    internalValue.value += variable
  }
}
</script>

<style lang="scss" scoped>
.variable-input-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.input-header {
  margin-bottom: 8px;
  .label-box {
    display: flex;
    align-items: center;
    gap: 6px;
    .label-text {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }
  }
}

.input-wrapper {
  position: relative;
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  :deep(.el-input) {
    --el-input-border-color: #e2e8f0;
    --el-input-hover-border-color: #cbd5e1;
    --el-input-focus-border-color: #6366f1;

    .el-input__wrapper {
      padding: 4px 12px;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;

      &:hover {
        border-color: #cbd5e1;
      }

      &.is-focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
    }

    .input-prefix-icon {
      color: #94a3b8;
      font-size: 16px;
    }
  }
}

.variable-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  margin: 2px 0;

  &:hover {
    background: #e2e8f0;
    color: #3b82f6;
    transform: scale(1.1);
  }
}

.variable-dropdown {
  padding: 4px;
  .dropdown-item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    min-width: 160px;

    .item-label {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }

    .item-key {
      font-size: 11px;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  }
}
</style>
