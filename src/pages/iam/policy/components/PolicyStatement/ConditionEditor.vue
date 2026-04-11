<template>
  <div class="ali-cond-orch">
    <div class="orch-header">
      <div class="h-left">
        <el-icon class="h-icon"><Filter /></el-icon>
        <span class="h-title">限制条件设置</span>
      </div>
    </div>

    <div class="orch-body">
      <el-scrollbar max-height="500px">
        <transition-group name="list-slide">
          <div v-for="(values, key) in stmt.condition" :key="key" class="rule-row">
            <!-- 1. 语义化逻辑组合 (左侧) -->
            <div class="rule-logic-group">
              <div class="logic-item key-box">
                <el-input
                  :model-value="String(key).startsWith('condition_') ? '' : key"
                  placeholder="选择条件 (例如: SourceIp)"
                  class="v4-ghost-input"
                  @update:model-value="(n) => updateKey(String(key), String(n))"
                />
              </div>
              <div class="logic-op">
                <el-select model-value="In" class="v4-ghost-select">
                  <el-option label="属于" value="In" />
                  <el-option label="不属于" value="NotIn" />
                </el-select>
              </div>
            </div>

            <!-- 2. 值容器 (中间，支持自动流转) -->
            <div class="rule-values-area">
              <div class="v-tags">
                <el-tag
                  v-for="(v, vIdx) in values"
                  :key="vIdx"
                  closable
                  class="v4-data-tag"
                  @close="removeValue(String(key), Number(vIdx))"
                >
                  {{ v }}
                </el-tag>
                <div class="v-adder">
                  <el-input
                    v-model="tempInputs[String(key)]"
                    placeholder="输入值..."
                    size="small"
                    class="v4-adder-input"
                    @keyup.enter="addValue(String(key))"
                  />
                </div>
              </div>
            </div>

            <!-- 3. 操作区 (靠近内容) -->
            <div class="rule-actions">
              <el-button link class="del-btn-v4" @click="removeKey(key)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </transition-group>

        <!-- 4. 底部添加锚点 -->
        <div class="append-trigger" @click="addConditionBlock">
          <el-icon><Plus /></el-icon>
          <span>新增限制条件对 (Condition Pair)</span>
        </div>

        <div v-if="conditionCount === 0" class="empty-guide">
          <p>暂无任何访问限制，策略将在全局环境下生效</p>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue"
import { Plus, Delete, Filter } from "@element-plus/icons-vue"
import type { Statement } from "@/api/iam/policy/type"

const props = defineProps<{
  stmt: Statement
}>()

const emit = defineEmits(["update:stmt"])

const tempInputs = reactive<Record<string, string>>({})

const conditionCount = computed(() => Object.keys(props.stmt.condition || {}).length)

const addConditionBlock = () => {
  const newKey = `condition_${Date.now()}`
  const nextCondition: Record<string, any> = { ...(props.stmt.condition || {}), [newKey]: [] }
  emit("update:stmt", { ...props.stmt, condition: nextCondition })
}

const updateKey = (oldKey: string, newKey: string) => {
  if (oldKey === newKey) return
  const nextCondition: Record<string, any> = { ...props.stmt.condition }
  nextCondition[newKey || `condition_${Date.now()}`] = nextCondition[oldKey]
  delete nextCondition[oldKey]
  emit("update:stmt", { ...props.stmt, condition: nextCondition })
}

const removeKey = (key: string) => {
  const nextCondition: Record<string, any> = { ...props.stmt.condition }
  delete nextCondition[key]
  emit("update:stmt", { ...props.stmt, condition: nextCondition })
}

const addValue = (key: string) => {
  const inputVal = tempInputs[key]
  if (!inputVal) return
  const nextCondition: Record<string, any> = { ...props.stmt.condition }
  nextCondition[key] = [...(nextCondition[key] || []), inputVal]
  emit("update:stmt", { ...props.stmt, condition: nextCondition })
  tempInputs[key] = ""
}

const removeValue = (key: string, idx: number) => {
  const nextCondition: Record<string, any> = { ...props.stmt.condition }
  if (nextCondition[key]) {
    nextCondition[key] = nextCondition[key].filter((_: any, i: number) => i !== idx)
    emit("update:stmt", { ...props.stmt, condition: nextCondition })
  }
}
</script>

<style lang="scss" scoped>
.ali-cond-orch {
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 2px;

  .orch-header {
    padding: 8px 16px;
    background: #fbfbfb;
    border-bottom: 1px solid #ebeef5;
    .h-left {
      display: flex;
      align-items: center;
      gap: 8px;
      .h-icon {
        color: #8c8c8c;
        font-size: 14px;
      }
      .h-title {
        font-size: 13px;
        color: #333;
        font-weight: 500;
      }
    }
  }

  .orch-body {
    padding: 8px;
    background: #fff;
  }

  .rule-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.2s;
    &:last-of-type {
      border-bottom: none;
    }
    &:hover {
      background: #f9f9f9;
      .rule-actions {
        opacity: 1;
      }
    }
  }

  // 核心样式：组合逻辑块
  .rule-logic-group {
    display: flex;
    align-items: stretch;
    border: 1px solid #dcdfe6;
    border-radius: 2px;
    overflow: hidden;
    width: 320px;
    flex-shrink: 0;

    .key-box {
      flex: 1;
      background: #fff;
    }
    .logic-op {
      width: 80px;
      background: #fafafa;
      border-left: 1px solid #dcdfe6;
    }

    :deep(.v4-ghost-input) {
      .el-input__wrapper {
        box-shadow: none !important;
        border-radius: 0;
        padding: 0 10px;
        height: 32px;
        background: transparent;
      }
    }
    :deep(.v4-ghost-select) {
      .el-input__wrapper {
        box-shadow: none !important;
        border-radius: 0;
        height: 32px;
        background: transparent;
      }
    }
  }

  .rule-values-area {
    flex: 1;
    min-width: 0;
    padding-top: 2px;
    .v-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .v-adder {
      width: 100px;
    }
    :deep(.v4-adder-input) {
      .el-input__wrapper {
        box-shadow: none !important;
        border: 1px dashed #dcdfe6 !important;
        border-radius: 2px;
        height: 28px;
        background: transparent;
        &:hover {
          border-color: #0070cc !important;
        }
      }
    }
  }

  .rule-actions {
    opacity: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    .del-btn-v4 {
      color: #8c8c8c;
      &:hover {
        color: #ff4d4f;
      }
    }
  }

  .append-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 12px 16px;
    padding: 12px;
    border: 1px dashed #dcdfe6;
    border-radius: 2px;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      border-color: #0070cc;
      color: #0070cc;
      background: #f0f7ff;
    }
  }

  .empty-guide {
    padding: 30px;
    text-align: center;
    color: #ccc;
    font-size: 12px;
  }
}

.v4-data-tag {
  background: #fff;
  border: 1px solid #d9d9d9;
  color: #595959;
  border-radius: 2px;
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: normal;
  :deep(.el-tag__close) {
    color: #8c8c8c;
    &:hover {
      background: #595959;
      color: #fff;
    }
  }
}

.list-slide-enter-active {
  transition: all 0.3s;
}
.list-slide-enter-from {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
