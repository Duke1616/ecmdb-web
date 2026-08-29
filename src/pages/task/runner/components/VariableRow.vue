<template>
  <div class="variable-row">
    <div class="variable-key-cell">
      <el-tooltip :content="variable.key" placement="top" :show-after="300">
        <span class="variable-key">{{ variable.key }}</span>
      </el-tooltip>
    </div>

    <div class="variable-value-cell">
      <el-input
        v-if="editing"
        v-model="draftValue"
        class="variable-edit-input"
        :type="variable.secret ? 'password' : 'text'"
        :placeholder="variable.secret ? '输入新值，留空保持不变' : '变量值'"
        @keyup.enter="save"
        @keyup.esc="cancel"
      />
      <el-tooltip
        v-else
        :content="variable.secret ? '敏感变量已隐藏' : variable.value"
        placement="top"
        :show-after="300"
      >
        <span class="variable-value" :class="{ masked: variable.secret }">
          {{ variable.secret ? "••••••••" : variable.value }}
        </span>
      </el-tooltip>
    </div>

    <div class="variable-type-cell">
      <span class="secret-badge" :class="{ sensitive: variable.secret }">
        {{ variable.secret ? "敏感" : "普通" }}
      </span>
    </div>

    <div class="variable-actions">
      <template v-if="editing">
        <button type="button" class="row-action row-save" title="保存修改" @click="save">
          <el-icon><Check /></el-icon>
        </button>
        <button type="button" class="row-action row-cancel" title="取消修改" @click="cancel">
          <el-icon><Close /></el-icon>
        </button>
      </template>
      <template v-else>
        <button type="button" class="row-action row-edit" title="编辑变量值" @click="startEdit">
          <el-icon><Edit /></el-icon>
        </button>
        <button type="button" class="row-action row-delete" title="删除变量" @click="emit('remove')">
          <el-icon><Delete /></el-icon>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Check, Close, Delete, Edit } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import type { variables } from "@/api/task/runner/types/runner"

const props = defineProps<{
  variable: variables
}>()

const emit = defineEmits<{
  update: [value: variables]
  remove: []
}>()

const editing = ref(false)
const draftValue = ref("")

const startEdit = () => {
  editing.value = true
  // 敏感值在详情中是占位符，留空提交表示保留原值。
  draftValue.value = props.variable.secret ? "" : props.variable.value
}

const cancel = () => {
  editing.value = false
  draftValue.value = ""
}

const save = () => {
  const value = draftValue.value.trim()
  if (!props.variable.secret && !value) {
    ElMessage.warning("变量值不能为空")
    return
  }

  emit("update", { ...props.variable, value: value || props.variable.value })
  cancel()
}
</script>

<style scoped lang="scss">
.variable-row {
  display: grid;
  grid-template-columns: var(--variable-grid-columns, minmax(0, 0.75fr) minmax(0, 1.25fr) 70px 56px);
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

    .row-action {
      opacity: 1;
    }
  }
}

.variable-key-cell,
.variable-value-cell {
  min-width: 0;
}

.variable-key,
.variable-value {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.variable-key {
  color: #1f2937;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
}

.variable-value {
  color: #667085;
  font-size: 12px;

  &.masked {
    color: #98a2b3;
    letter-spacing: 0.08em;
  }
}

.variable-type-cell {
  display: flex;
  grid-column: 3;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

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

.variable-actions {
  display: flex;
  grid-column: 4;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  min-width: 0;
}

.row-action {
  display: inline-flex;
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

  &.row-edit:hover,
  &.row-save:hover {
    color: #2563eb;
    background: #eff6ff;
  }

  &.row-save:hover {
    color: #16a34a;
    background: #f0fdf4;
  }

  &.row-cancel:hover,
  &.row-delete:hover {
    color: #d92d20;
    background: #fff1f0;
  }
}

.variable-edit-input {
  :deep(.el-input__wrapper) {
    padding: 0 8px;
  }
}

@media (max-width: 768px) {
  .variable-row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 8px 10px;
  }

  .variable-type-cell {
    grid-column: auto;
    justify-content: flex-start;
  }

  .variable-actions {
    grid-column: auto;
    justify-content: space-between;
  }

  .row-action {
    opacity: 1;
  }
}
</style>
