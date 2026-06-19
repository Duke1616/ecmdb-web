<template>
  <div class="variable-configuration">
    <div class="variables-container">
      <div class="variable-input-wrapper">
        <div class="input-row">
          <el-input v-model="variableInput.key" placeholder="变量名" class="variable-input key-input" @keyup.enter="addVariable">
            <template #prefix>
              <span class="input-prefix">KEY</span>
            </template>
          </el-input>
          <el-input
            v-model="variableInput.value"
            placeholder="变量值"
            class="variable-input value-input"
            :type="variableInput.secret ? 'password' : 'text'"
            @keyup.enter="addVariable"
          >
            <template #prefix>
              <span class="input-prefix">VALUE</span>
            </template>
          </el-input>
          <button type="button" class="secret-toggle" :class="{ active: variableInput.secret }" @click="variableInput.secret = !variableInput.secret">
            <span class="toggle-dot"></span>
            {{ variableInput.secret ? "敏感" : "普通" }}
          </button>
          <el-button
            type="primary"
            class="add-button"
            :icon="Plus"
            @click="addVariable"
            :disabled="!variableInput.key.trim() || !variableInput.value.trim()"
          >
            添加
          </el-button>
        </div>
      </div>

      <div class="variables-display" v-if="variableList.length > 0">
        <div class="variables-header">
          <div class="variables-title">
            <span class="variables-count">变量 {{ variableList.length }}</span>
            <span class="variables-subtitle">运行时注入</span>
          </div>
          <el-button class="clear-action" size="small" :icon="Delete" @click="clearAllVariables" text> 清空 </el-button>
        </div>
        <div class="variables-list">
          <div v-for="(variable, index) in variableList" :key="index" class="variable-item">
            <div class="variable-content">
              <span class="variable-key">{{ variable.key }}</span>
              <span class="variable-equals">=</span>
              <span class="variable-value" :class="{ masked: variable.secret }">
                {{ variable.secret ? "••••••••" : variable.value }}
              </span>
            </div>
            <div class="variable-actions">
              <span class="secret-badge" :class="{ sensitive: variable.secret }">
                {{ variable.secret ? "敏感" : "普通" }}
              </span>
              <button type="button" class="row-delete" @click="removeVariable(index)" title="删除变量">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-variables" v-else>
        <span class="empty-dot"></span>
        <span>按需添加执行器运行时变量</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import type { variables } from "@/api/task/runner/types/runner"

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

const variableInput = ref({
  key: "",
  value: "",
  secret: false
})

const variableList = ref<variables[]>([])

const addVariable = () => {
  const key = variableInput.value.key.trim()
  const value = variableInput.value.value.trim()

  if (!key || !value) return

  if (variableList.value.some((v: variables) => v.key === key)) {
    ElMessage.warning("变量名已存在，请使用不同的名称")
    return
  }

  variableList.value.push({
    key,
    value,
    secret: variableInput.value.secret
  })

  variableInput.value = {
    key: "",
    value: "",
    secret: false
  }

  emitChange()
}

const removeVariable = (index: number) => {
  variableList.value.splice(index, 1)
  emitChange()
}

const clearAllVariables = () => {
  variableList.value = []
  emitChange()
}

const emitChange = () => {
  emits("update:modelValue", [...variableList.value])
  emits("change", [...variableList.value])
}

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

  .variables-container {
    width: 100%;
    max-width: 100%;

    .variable-input-wrapper {
      margin-bottom: 8px;
      padding: 8px;
      background: #ffffff;
      border: 1px solid #dfe5ee;
      border-radius: 8px;

      .input-row {
        display: grid;
        grid-template-columns: minmax(130px, 0.85fr) minmax(170px, 1.15fr) 74px 82px;
        gap: 6px;
        align-items: center;

        .variable-input {
          min-width: 0;

          :deep(.el-input__wrapper) {
            height: 34px;
            min-height: 34px;
            padding: 0 10px;
            background: #fbfdff;
            border-radius: 6px;
            box-shadow: 0 0 0 1px #d8e0eb inset;
            transition:
              background 0.18s ease,
              box-shadow 0.18s ease;

            &:hover {
              background: #ffffff;
              box-shadow: 0 0 0 1px #b8c4d4 inset;
            }

            &.is-focus {
              background: #ffffff;
              box-shadow:
                0 0 0 1px #3b82f6 inset,
                0 0 0 3px rgba(59, 130, 246, 0.1);
            }
          }

          :deep(.el-input__prefix) {
            margin-right: 8px;
          }

          :deep(.el-input__inner) {
            color: #1f2937;
            font-size: 13px;
          }
        }

        .input-prefix {
          display: inline-flex;
          align-items: center;
          height: 18px;
          color: #8a96a8;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }

        .secret-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 34px;
          padding: 0 10px;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #d8e0eb;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition:
            color 0.18s ease,
            background 0.18s ease,
            border-color 0.18s ease;

          .toggle-dot {
            width: 6px;
            height: 6px;
            background: #22c55e;
            border-radius: 999px;
          }

          &:hover {
            background: #ffffff;
            border-color: #b8c4d4;
          }

          &.active {
            color: #b42318;
            background: #fff7f5;
            border-color: #f4b7ae;

            .toggle-dot {
              background: #f04438;
            }
          }
        }

        .add-button {
          min-width: 0;
          height: 34px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
      }
    }

    .variables-display {
      overflow: hidden;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #dfe5ee;

      .variables-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 32px;
        padding: 0 10px;
        background: #fbfcfe;
        border-bottom: 1px solid #edf1f6;

        .variables-title {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .variables-count {
          color: #344054;
          font-size: 12px;
          font-weight: 600;
        }

        .variables-subtitle {
          color: #98a2b3;
          font-size: 12px;
        }
      }

      .variables-list {
        display: flex;
        flex-direction: column;

        .variable-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          min-height: 38px;
          padding: 5px 8px 5px 10px;
          background: #ffffff;
          border-bottom: 1px solid #edf1f6;
          transition: background 0.15s ease;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: #fbfdff;

            .row-delete {
              opacity: 1;
            }
          }

          .variable-content {
            display: flex;
            align-items: center;
            gap: 7px;
            min-width: 0;
            flex: 1;

            .variable-key,
            .variable-value {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .variable-key {
              flex: 0 1 auto;
              max-width: 42%;
              color: #1f2937;
              font-family:
                ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              font-size: 12px;
              font-weight: 700;
            }

            .variable-equals {
              flex: 0 0 auto;
              color: #b4bfcd;
              font-size: 12px;
              font-weight: 600;
            }

            .variable-value {
              flex: 1;
              min-width: 40px;
              color: #667085;
              font-size: 12px;

              &.masked {
                color: #98a2b3;
                letter-spacing: 0.08em;
              }
            }
          }

          .variable-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            flex: 0 0 auto;

            .secret-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              height: 20px;
              min-width: 38px;
              padding: 0 7px;
              color: #16803c;
              background: #f2fbf5;
              border: 1px solid #c7efd5;
              border-radius: 999px;
              font-size: 11px;
              font-weight: 600;

              &.sensitive {
                color: #b42318;
                background: #fff7f5;
                border-color: #f4b7ae;
              }
            }
          }
        }
      }
    }

    .clear-action {
      height: 26px;
      padding: 0 4px;
      color: #98a2b3;
      font-size: 12px;

      &:hover {
        color: #d92d20;
      }
    }

    .row-delete {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      color: #98a2b3;
      background: transparent;
      border: 0;
      border-radius: 5px;
      cursor: pointer;
      opacity: 0.45;
      transition:
        opacity 0.15s ease,
        color 0.15s ease,
        background 0.15s ease;

      &:hover {
        color: #d92d20;
        background: #fff1f0;
      }
    }

    .empty-variables {
      display: flex;
      align-items: center;
      gap: 7px;
      min-height: 30px;
      padding: 0 10px;
      color: #98a2b3;
      background: transparent;
      border: 1px dashed #dfe5ee;
      border-radius: 8px;

      span {
        font-size: 12px;
      }

      .empty-dot {
        width: 6px;
        height: 6px;
        background: #cbd5e1;
        border-radius: 999px;
      }
    }
  }
}

@media (max-width: 768px) {
  .variable-configuration {
    .variables-container {
      .variable-input-wrapper {
        .input-row {
          grid-template-columns: 1fr;
          gap: 8px;

          .secret-toggle,
          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
