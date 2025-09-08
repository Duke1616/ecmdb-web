<template>
  <div class="variable-configuration">
    <div class="variable-header">
      <div class="label-with-tip">
        <span>变量配置</span>
        <el-tooltip content="配置执行器运行时需要的环境变量和参数" placement="top">
          <el-icon class="tip-icon"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
    </div>

    <div class="variables-container">
      <!-- 变量输入区域 -->
      <div class="variable-input-wrapper">
        <div class="input-row">
          <el-input v-model="variableInput.key" placeholder="变量名" size="large" class="variable-input" />
          <el-input
            v-model="variableInput.value"
            placeholder="变量值"
            size="large"
            class="variable-input"
            :type="variableInput.secret ? 'password' : 'text'"
          />
          <div class="secret-switch">
            <el-switch v-model="variableInput.secret" size="large" active-text="敏感" inactive-text="普通" />
          </div>
          <el-button
            type="primary"
            size="large"
            :icon="Plus"
            @click="addVariable"
            :disabled="!variableInput.key.trim() || !variableInput.value.trim()"
          >
            添加
          </el-button>
        </div>
      </div>

      <!-- 变量显示区域 -->
      <div class="variables-display" v-if="variableList.length > 0">
        <div class="variables-header">
          <span class="variables-count">已配置 {{ variableList.length }} 个变量</span>
          <el-button type="danger" size="small" :icon="Delete" @click="clearAllVariables" text> 清空 </el-button>
        </div>
        <div class="variables-list">
          <div v-for="(variable, index) in variableList" :key="index" class="variable-item">
            <div class="variable-content">
              <div class="variable-key">
                <el-icon><Key /></el-icon>
                <span>{{ variable.key }}</span>
              </div>
              <div class="variable-value">
                <el-icon><Document /></el-icon>
                <span v-if="variable.secret">••••••••</span>
                <span v-else>{{ variable.value }}</span>
              </div>
              <div class="variable-secret">
                <el-tag :type="variable.secret ? 'danger' : 'success'" size="small" effect="light">
                  {{ variable.secret ? "敏感" : "普通" }}
                </el-tag>
              </div>
            </div>
            <el-button type="danger" size="small" :icon="Delete" @click="removeVariable(index)" text />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-variables" v-else>
        <el-icon><Setting /></el-icon>
        <span>暂无变量，请添加执行器需要的环境变量</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { Plus, Delete, Key, Document, Setting, QuestionFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import type { variables } from "@/api/runner/types/runner"

// 接收父组件传递
interface Props {
  modelValue?: variables[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => []
})

const emits = defineEmits<{
  "update:modelValue": [value: variables[]]
  change: [value: variables[]]
}>()

// 变量相关状态
const variableInput = ref({
  key: "",
  value: "",
  secret: false
})

const variableList = ref<variables[]>([])

// 添加变量
const addVariable = () => {
  const key = variableInput.value.key.trim()
  const value = variableInput.value.value.trim()

  if (!key || !value) return

  // 检查是否已存在相同的 key
  if (variableList.value.some((v: variables) => v.key === key)) {
    ElMessage.warning("变量名已存在，请使用不同的名称")
    return
  }

  variableList.value.push({
    key,
    value,
    secret: variableInput.value.secret
  })

  // 清空输入
  variableInput.value = {
    key: "",
    value: "",
    secret: false
  }

  emitChange()
}

// 移除变量
const removeVariable = (index: number) => {
  variableList.value.splice(index, 1)
  emitChange()
}

// 清空所有变量
const clearAllVariables = () => {
  variableList.value = []
  emitChange()
}

// 发送变化事件
const emitChange = () => {
  emits("update:modelValue", [...variableList.value])
  emits("change", [...variableList.value])
}

// 监听 props 变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      variableList.value = [...newValue]
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.variable-configuration {
  width: 100%;
  max-width: 100%;

  .variable-header {
    margin-bottom: 16px;

    .label-with-tip {
      display: flex;
      align-items: center;
      gap: 6px;

      span {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }

      .tip-icon {
        font-size: 14px;
        color: #9ca3af;
        cursor: help;

        &:hover {
          color: #6b7280;
        }
      }
    }
  }

  .variables-container {
    width: 100%;
    max-width: 100%;
    .variable-input-wrapper {
      margin-bottom: 16px;

      .input-row {
        display: flex;
        gap: 12px;
        align-items: center;

        .variable-input {
          flex: 1;

          :deep(.el-input__wrapper) {
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;

            &:hover {
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            }

            &.is-focus {
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
          }
        }

        .secret-switch {
          min-width: 120px;

          :deep(.el-switch__label) {
            font-size: 12px;
          }
        }
      }
    }

    .variables-display {
      margin-bottom: 16px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      .variables-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .variables-count {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
      }

      .variables-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .variable-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;

          &:hover {
            border-color: #3b82f6;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
          }

          .variable-content {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;

            .variable-key {
              display: flex;
              align-items: center;
              gap: 6px;
              min-width: 120px;

              .el-icon {
                color: #3b82f6;
                font-size: 14px;
              }

              span {
                font-weight: 500;
                color: #374151;
              }
            }

            .variable-value {
              display: flex;
              align-items: center;
              gap: 6px;
              flex: 1;
              min-width: 0;

              .el-icon {
                color: #10b981;
                font-size: 14px;
              }

              span {
                color: #6b7280;
                word-break: break-all;
              }
            }

            .variable-secret {
              min-width: 60px;
            }
          }
        }
      }
    }

    .empty-variables {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      color: #9ca3af;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      .el-icon {
        font-size: 32px;
        margin-bottom: 12px;
        color: #d1d5db;
      }

      span {
        font-size: 14px;
        text-align: center;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .variable-configuration {
    .variables-container {
      .variable-input-wrapper {
        .input-row {
          flex-direction: column;
          gap: 8px;

          .secret-switch {
            min-width: auto;
            width: 100%;
          }
        }
      }

      .variables-display {
        padding: 12px;

        .variables-list {
          .variable-item {
            .variable-content {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;

              .variable-key,
              .variable-value {
                min-width: auto;
                width: 100%;
              }
            }
          }
        }
      }
    }
  }
}
</style>
