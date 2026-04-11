<template>
  <SectionPanel title="限制条件">
    <template #preview>
      {{
        stmt.condition && Object.keys(stmt.condition).length > 0
          ? Object.keys(stmt.condition).length + " 条环境限制规则"
          : "无特定约束条件"
      }}
    </template>

    <div class="ali-cond-orch">
      <div class="orch-header">
        <div class="h-left">
          <el-icon class="h-icon"><Filter /></el-icon>
          <span class="h-title">限制条件设置 (Environment Conditions)</span>
        </div>
      </div>

      <div class="orch-body">
        <el-scrollbar max-height="500px">
          <transition-group name="list-slide">
            <div v-for="[key, values] in conditionEntries" :key="key" class="rule-row">
              <!-- 1. 逻辑键配对 -->
              <div class="rule-logic-group">
                <div class="logic-item key-box">
                  <el-input
                    :model-value="key.startsWith('condition_') ? '' : key"
                    placeholder="条件键 (如: IpAddress)"
                    class="v4-ghost-input"
                    @update:model-value="(n: string | number | null) => updateKey(key, String(n))"
                  />
                </div>
                <div class="logic-op">
                  <el-select model-value="StringEquals" class="v4-ghost-select">
                    <el-option label="等于" value="StringEquals" />
                    <el-option label="不等于" value="StringNotEquals" />
                    <el-option label="包含" value="StringLike" />
                  </el-select>
                </div>
              </div>

              <!-- 2. 值集合 -->
              <div class="rule-values-area">
                <div class="v-tags">
                  <el-tag
                    v-for="(v, vIdx) in values"
                    :key="vIdx"
                    closable
                    class="v4-data-tag"
                    @close="removeValue(key, vIdx as number)"
                  >
                    {{ v }}
                  </el-tag>
                  <div class="v-adder">
                    <el-input
                      v-model="tempInputs[key]"
                      placeholder="添加值..."
                      size="small"
                      class="v4-adder-input"
                      @keyup.enter="addValue(key)"
                    />
                  </div>
                </div>
              </div>

              <!-- 3. 行操作 -->
              <div class="rule-actions">
                <el-button link class="del-btn-v4" @click="removeKey(key)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </transition-group>

          <!-- 4. 添加锚点 -->
          <div v-if="conditionEntries.length < 10" class="append-trigger" @click="addConditionBlock">
            <el-icon><Plus /></el-icon>
            <span>新增条件判断</span>
          </div>

          <div v-if="conditionEntries.length === 0" class="empty-guide">
            <el-empty :image-size="40" description="暂无条件约束，该语句将对所有环境生效" />
          </div>
        </el-scrollbar>
      </div>
    </div>
  </SectionPanel>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue"
import { Plus, Delete, Filter } from "@element-plus/icons-vue"
import SectionPanel from "./SectionPanel.vue"
import type { StatementVO } from "../../../types"

const props = defineProps<{ stmt: StatementVO }>()
const emit = defineEmits(["update:stmt"])

const tempInputs = reactive<Record<string, string>>({})

const conditionEntries = computed(() => Object.entries(props.stmt.condition || {}) as [string, string[]][])

const patchCondition = (next: Record<string, string[]>) => {
  emit("update:stmt", { ...props.stmt, condition: next })
}

const addConditionBlock = () => {
  patchCondition({ ...(props.stmt.condition || {}), [`condition_${Date.now()}`]: [] })
}

const updateKey = (oldKey: string, newKey: string) => {
  if (oldKey === newKey) return
  const next = { ...props.stmt.condition }
  next[newKey || `condition_${Date.now()}`] = next[oldKey]
  delete next[oldKey]
  patchCondition(next)
}

const removeKey = (key: string) => {
  const next = { ...props.stmt.condition }
  delete next[key]
  patchCondition(next)
}

const addValue = (key: string) => {
  const val = tempInputs[key]?.trim()
  if (!val) return
  const current = props.stmt.condition[key] || []
  if (!current.includes(val)) {
    patchCondition({ ...props.stmt.condition, [key]: [...current, val] })
  }
  tempInputs[key] = ""
}

const removeValue = (key: string, index: number) => {
  const current = props.stmt.condition[key]
  if (!current) return
  patchCondition({
    ...props.stmt.condition,
    [key]: current.filter((_, i) => i !== index)
  })
}
</script>

<style lang="scss" scoped>
.ali-cond-orch {
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 2px;

  .orch-header {
    padding: 10px 16px;
    background: #fafafa;
    border-bottom: 1px solid #ebeef5;
    .h-title {
      font-size: 13px;
      font-weight: bold;
      color: #666;
    }
  }

  .orch-body {
    padding: 8px;
  }

  .rule-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    &:hover {
      background: #f9f9f9;
      .rule-actions {
        opacity: 1;
      }
    }
    &:last-child {
      border-bottom: none;
    }
  }

  .rule-logic-group {
    display: flex;
    width: 340px;
    flex-shrink: 0;
    border: 1px solid #dcdfe6;
    border-radius: 2px;
    overflow: hidden;
    .key-box {
      flex: 1;
      :deep(.el-input__wrapper) {
        box-shadow: none !important;
      }
    }
    .logic-op {
      width: 100px;
      border-left: 1px solid #dcdfe6;
      :deep(.el-input__wrapper) {
        box-shadow: none !important;
        background: #fafafa;
      }
    }
  }

  .rule-values-area {
    flex: 1;
    .v-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .v-adder {
      width: 120px;
      :deep(.el-input__wrapper) {
        box-shadow: none !important;
        border: 1px dashed #d9d9d9 !important;
      }
    }
  }

  .rule-actions {
    opacity: 0;
    transition: opacity 0.2s;
    .del-btn-v4 {
      color: #999;
      &:hover {
        color: #ff4d4f;
      }
    }
  }

  .append-trigger {
    margin: 12px;
    padding: 12px;
    border: 1px dashed #dcdfe6;
    text-align: center;
    color: #0070cc;
    cursor: pointer;
    font-size: 13px;
    &:hover {
      background: #f0f7ff;
      border-color: #0070cc;
    }
  }
}
</style>
