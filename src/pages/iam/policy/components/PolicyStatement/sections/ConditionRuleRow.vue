<template>
  <div class="rule-row">
    <!-- 1. 逻辑键配对 -->
    <div class="rule-logic-group">
      <div class="logic-item key-box">
        <el-input
          :model-value="ruleKey.startsWith('condition_') ? '' : ruleKey"
          placeholder="条件键 (如: IpAddress)"
          class="v4-ghost-input"
          @update:model-value="onKeyUpdate"
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
        <el-tag v-for="(v, vIdx) in values" :key="vIdx" closable class="v4-data-tag" @close="emit('removeValue', vIdx)">
          {{ v }}
        </el-tag>
        <div class="v-adder">
          <el-input
            v-model="tempValue"
            placeholder="添加值..."
            size="small"
            class="v4-adder-input"
            @keyup.enter="onAddValue"
          />
        </div>
      </div>
    </div>

    <!-- 3. 行操作 -->
    <div class="rule-actions">
      <el-button link class="del-btn-v4" @click="emit('remove')">
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Delete } from "@element-plus/icons-vue"

defineProps<{
  ruleKey: string
  values: string[]
}>()

const emit = defineEmits(["updateKey", "addValue", "removeValue", "remove"])

const tempValue = ref("")

const onKeyUpdate = (val: string | number | null) => {
  emit("updateKey", String(val))
}

const onAddValue = () => {
  const val = tempValue.value.trim()
  if (val) {
    emit("addValue", val)
    tempValue.value = ""
  }
}
</script>

<style lang="scss" scoped>
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
  width: 320px;
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
</style>
