<template>
  <SectionPanel :label="label" :required="required">
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
          <ConditionRuleRow
            v-for="(values, key) in stmt.condition"
            :key="key"
            :rule-key="String(key)"
            :values="values"
            @update-key="(newKey) => updateKey(String(key), newKey)"
            @remove="removeKey(String(key))"
            @add-value="(val) => addValue(String(key), val)"
            @remove-value="(idx) => removeValue(String(key), idx)"
          />

          <div class="append-trigger" @click="addNewCondition">
            <el-icon><Plus /></el-icon>
            <span>添加新的限定条件判断线...</span>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </SectionPanel>
</template>

<script setup lang="ts">
import { Plus, Filter } from "@element-plus/icons-vue"
import SectionPanel from "./SectionPanel.vue"
import ConditionRuleRow from "./ConditionRuleRow.vue"
import type { StatementVO } from "../../../composables/usePolicyData"

const props = defineProps<{ label: string; stmt: StatementVO; required?: boolean }>()
const emit = defineEmits(["update:stmt"])

const patchCondition = (condition: Record<string, string[]>) => {
  emit("update:stmt", { ...props.stmt, condition })
}

/** 更新某个 Key 名 */
const updateKey = (oldKey: string, newKey: string) => {
  if (oldKey === newKey) return
  const next = { ...props.stmt.condition }
  next[newKey] = next[oldKey]
  delete next[oldKey]
  patchCondition(next)
}

/** 移除一整行判断 */
const removeKey = (key: string) => {
  const next = { ...props.stmt.condition }
  delete next[key]
  patchCondition(next)
}

/** 为某行添加 Value */
const addValue = (key: string, val: string) => {
  const next = { ...props.stmt.condition }
  next[key] = [...(next[key] || []), val]
  patchCondition(next)
}

/** 为某行移除 Value */
const removeValue = (key: string, idx: number) => {
  const next = { ...props.stmt.condition }
  next[key] = next[key].filter((_, i) => i !== idx)
  patchCondition(next)
}

/** 添加新行（生成一个唯一的占位 Key） */
const addNewCondition = () => {
  const next = { ...props.stmt.condition }
  const newKey = `condition_${Date.now()}`
  next[newKey] = []
  patchCondition(next)
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
    padding: 0;
  }

  .append-trigger {
    margin: 12px;
    padding: 12px;
    border: 1px dashed #dcdfe6;
    text-align: center;
    color: #0070cc;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    &:hover {
      background: #f0f7ff;
      border-color: #0070cc;
    }
  }
}
</style>
