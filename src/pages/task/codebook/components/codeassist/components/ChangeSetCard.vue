<template>
  <section class="change-set-card" :class="changeSet.status.toLowerCase()">
    <header class="change-set-heading">
      <div class="heading-copy">
        <span class="eyebrow"
          ><el-icon><Files /></el-icon> 项目变更</span
        >
        <strong>{{ changeSet.summary || "AI 生成的候选变更" }}</strong>
        <small>{{ changeSummary }} · 基于修订 #{{ changeSet.base_revision }}</small>
      </div>
      <span class="status-badge" :class="changeSet.status.toLowerCase()">{{ statusLabel }}</span>
    </header>

    <button class="files-toggle" type="button" @click="expanded = !expanded">
      <span>{{ expanded ? "收起文件" : `查看 ${changeSet.items.length} 个文件` }}</span>
      <el-icon :class="{ expanded }"><ArrowDown /></el-icon>
    </button>

    <div v-if="expanded" class="change-files">
      <ChangeFileItem
        v-for="item in changeSet.items"
        :key="`${item.operation}-${item.path}`"
        :item="item"
        :active-file-id="activeFileId"
        @load="$emit('load-file', $event)"
      />
    </div>

    <div v-if="statusHint" class="status-hint" :class="{ error: hasErrors }">
      <el-icon><InfoFilled /></el-icon>
      <span>{{ statusHint }}</span>
    </div>

    <footer class="change-set-actions">
      <span v-if="changeSet.status === AIChangeSetStatus.APPLIED" class="applied-copy">
        <el-icon><CircleCheckFilled /></el-icon> 已同步到项目当前版本
      </span>
      <span v-else>应用时会原子更新全部文件</span>
      <AuthButton
        :capability="capabilities.CodeAssist.ApplyChangeSet"
        size="small"
        type="primary"
        :loading="applying"
        :disabled="!canApply"
        @click="$emit('apply', changeSet)"
      >
        {{ changeSet.status === AIChangeSetStatus.APPLIED ? "已应用" : "应用全部变更" }}
      </AuthButton>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { ArrowDown, CircleCheckFilled, Files, InfoFilled } from "@element-plus/icons-vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { AIChangeOperation, AIChangeSetStatus, AIDiagnosticSeverity } from "@/api/task/codeassist/ai.enums"
import type { AIChangeItem, AIChangeSet } from "@/api/task/codeassist/types"
import ChangeFileItem from "./ChangeFileItem.vue"

const props = defineProps<{
  changeSet: AIChangeSet
  activeFileId: number
  applying: boolean
  readonly: boolean
}>()

defineEmits<{
  (event: "apply", changeSet: AIChangeSet): void
  (event: "load-file", item: AIChangeItem): void
}>()

const capabilities = TASK_CAPABILITIES
const expanded = ref(true)
const statusLabels: Record<AIChangeSetStatus, string> = {
  [AIChangeSetStatus.DRAFT]: "需要修正",
  [AIChangeSetStatus.VALIDATED]: "可应用",
  [AIChangeSetStatus.APPLYING]: "应用中",
  [AIChangeSetStatus.APPLIED]: "已应用"
}
const createCount = computed(
  () => props.changeSet.items.filter((item) => item.operation === AIChangeOperation.CREATE).length
)
const updateCount = computed(
  () => props.changeSet.items.filter((item) => item.operation === AIChangeOperation.UPDATE).length
)
const hasErrors = computed(() =>
  props.changeSet.items.some((item) =>
    item.diagnostics?.some((diagnostic) => diagnostic.severity === AIDiagnosticSeverity.ERROR)
  )
)
const canApply = computed(
  () => props.changeSet.status === AIChangeSetStatus.VALIDATED && !hasErrors.value && !props.applying && !props.readonly
)
const changeSummary = computed(() => {
  const parts = [`${props.changeSet.items.length} 个文件`]
  if (createCount.value) parts.push(`${createCount.value} 个新建`)
  if (updateCount.value) parts.push(`${updateCount.value} 个修改`)
  return parts.join(" · ")
})
const statusLabel = computed(() => statusLabels[props.changeSet.status])
const statusHint = computed(() => {
  if (props.changeSet.status === AIChangeSetStatus.DRAFT) {
    return "变更未通过检查，请根据诊断信息让 AI 重新生成。"
  }
  if (props.changeSet.status === AIChangeSetStatus.APPLYING) return "正在应用整组变更，请稍候。"
  if (hasErrors.value) return "存在错误级诊断，当前变更不能应用。"
  if (props.readonly && props.changeSet.status !== AIChangeSetStatus.APPLIED) {
    return "当前项目处于只读状态，无法应用变更。"
  }
  return ""
})
</script>

<style scoped lang="scss">
.change-set-card {
  margin: -3px 0 17px 16px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d9e2f0;
  border-top: 3px solid #6366f1;
  border-radius: 11px;
  box-shadow: 0 7px 20px rgba(15, 23, 42, 0.055);

  &.applied {
    border-top-color: #22c55e;
  }

  &.draft {
    border-top-color: #f59e0b;
  }
}

.change-set-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 11px 8px;
}

.heading-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;

  strong {
    margin-top: 4px;
    color: #26354b;
    font-size: 12px;
    line-height: 1.45;
  }

  small {
    margin-top: 3px;
    color: var(--el-text-color-placeholder);
    font-size: 9px;
  }
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #6366f1;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.status-badge {
  flex-shrink: 0;
  padding: 3px 7px;
  color: #64748b;
  font-size: 9px;
  font-weight: 600;
  background: #f1f5f9;
  border-radius: 6px;

  &.validated {
    color: #15803d;
    background: #dcfce7;
  }

  &.applied {
    color: #1d4ed8;
    background: #dbeafe;
  }

  &.draft {
    color: #b45309;
    background: #fef3c7;
  }
}

.files-toggle {
  display: flex;
  width: calc(100% - 22px);
  align-items: center;
  justify-content: space-between;
  margin: 0 11px 8px;
  padding: 6px 8px;
  color: #52647d;
  font-size: 10px;
  cursor: pointer;
  background: #f8fafc;
  border: 0;
  border-radius: 6px;

  .el-icon {
    transition: transform 0.2s ease;

    &.expanded {
      transform: rotate(180deg);
    }
  }
}

.change-files {
  display: flex;
  padding: 0 10px 9px;
  flex-direction: column;
  gap: 7px;
}

.status-hint {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: 0 10px 8px;
  padding: 7px 8px;
  color: #a16207;
  font-size: 9px;
  line-height: 1.45;
  background: #fffbeb;
  border-radius: 6px;

  &.error {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }
}

.change-set-actions {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 9px 7px 11px;
  color: var(--el-text-color-placeholder);
  font-size: 9px;
  background: #fbfcfe;
  border-top: 1px solid var(--el-border-color-lighter);
}

.applied-copy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #15803d;
}
</style>
