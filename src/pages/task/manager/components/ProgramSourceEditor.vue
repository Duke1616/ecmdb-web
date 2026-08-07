<template>
  <div v-if="program" class="program-source-editor">
    <div class="program-toolbar">
      <div class="program-identity">
        <span class="program-title">{{ programTitle }}</span>
        <span class="source-label">选择代码在任务中的提供方式</span>
      </div>
    </div>

    <div class="source-selector">
      <el-radio-group v-model="sourceKind" class="source-options">
        <el-radio-button
          v-for="option in sourceOptions"
          :key="option.value"
          :value="option.value"
          class="source-option"
        >
          <span class="source-option-title">{{ option.label }}</span>
          <span class="source-option-desc">{{ option.description }}</span>
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="program-content">
      <div v-if="sourceKind === 'code'" class="editor-content">
        <CodeEditor :code="program.inline?.code || ''" :language="language" @update:code="setCode" />
      </div>

      <div v-else class="picker-content">
        <div class="picker-label">
          <span>{{ sourceKind === "project" ? "项目入口文件" : "脚本文件" }}</span>
          <span class="required-mark">*</span>
        </div>
        <CodebookPicker
          v-if="sourceKind === 'codebook'"
          :model-value="program.inline?.codebook_id || undefined"
          variant="element"
          placeholder="请选择脚本文件"
          @update:model-value="setInlineCodebook"
        />
        <CodebookPicker
          v-else
          :model-value="program.project?.entry_codebook_id || undefined"
          variant="element"
          placeholder="请选择项目入口文件"
          @update:model-value="setProjectEntry"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import CodeEditor from "@@/components/CodeEditor/index.vue"
import CodebookPicker from "@@/components/CodebookPicker/index.vue"
import { ProgramKind, type ProgramKind as ProgramKindType, type ProgramSpec } from "@/api/task/program"

const props = withDefaults(
  defineProps<{
    programKinds: ProgramKindType[]
    language?: string
  }>(),
  { language: "shell" }
)
const program = defineModel<ProgramSpec | undefined>({ required: true })

type SourceKind = "code" | "codebook" | "project"

const sourceKind = computed<SourceKind>({
  get: () => {
    if (program.value?.kind === ProgramKind.PROJECT) return "project"
    return program.value?.inline?.codebook_id !== undefined ? "codebook" : "code"
  },
  set: setSource
})

const sourceOptions = computed(() => {
  const options: Array<{ value: SourceKind; label: string; description: string }> = []
  if (props.programKinds.includes(ProgramKind.INLINE)) {
    options.push({ value: "code", label: "直接编写", description: "保存到当前任务" })
    options.push({ value: "codebook", label: "脚本文件", description: "引用已保存脚本" })
  }
  if (props.programKinds.includes(ProgramKind.PROJECT)) {
    options.push({ value: "project", label: "完整项目", description: "加载同项目文件" })
  }
  return options
})

const languageLabel = computed(() => {
  const value = props.language.trim().toLowerCase()
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "脚本"
})
const programTitle = computed(() => `${languageLabel.value} 程序`)

function setSource(source: SourceKind) {
  if (source === "project") {
    program.value = {
      kind: ProgramKind.PROJECT,
      project: { entry_codebook_id: program.value?.project?.entry_codebook_id || 0 }
    }
    return
  }
  program.value =
    source === "code"
      ? { kind: ProgramKind.INLINE, inline: { code: program.value?.inline?.code || "" } }
      : { kind: ProgramKind.INLINE, inline: { codebook_id: program.value?.inline?.codebook_id || 0 } }
}

const setCode = (code: string) => (program.value = { kind: ProgramKind.INLINE, inline: { code } })
const setInlineCodebook = (id: number | number[] | undefined) =>
  (program.value = {
    kind: ProgramKind.INLINE,
    inline: { codebook_id: Array.isArray(id) ? id[0] || 0 : id || 0 }
  })
const setProjectEntry = (id: number | number[] | undefined) =>
  (program.value = {
    kind: ProgramKind.PROJECT,
    project: { entry_codebook_id: Array.isArray(id) ? id[0] || 0 : id || 0 }
  })
</script>

<style scoped lang="scss">
.program-source-editor {
  width: 100%;
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.program-toolbar {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 6px 14px;
  background: #fbfcfe;
}

.program-identity {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.program-title {
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.source-label {
  color: #94a3b8;
  font-size: 11px;
  white-space: nowrap;
}

.source-selector {
  padding: 6px 10px 8px;
  background: #fbfcfe;
  border-bottom: 1px solid #e2e8f0;
}

.source-options {
  display: grid !important;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 6px;
  width: 100%;

  :deep(.el-radio-button) {
    display: block;
    min-width: 0;
  }

  :deep(.el-radio-button__inner) {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    min-height: 38px;
    padding: 6px 10px;
    color: #475569;
    text-align: left;
    background: #fff;
    border: 1px solid #dce3ec !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    transition:
      border-color 0.16s ease,
      background-color 0.16s ease;
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    color: #2563eb;
    background: #eff6ff;
    border-color: #60a5fa !important;
    box-shadow: inset 3px 0 0 #3b82f6 !important;
  }

  :deep(.el-radio-button:not(.is-disabled) .el-radio-button__inner:hover) {
    color: #2563eb;
    border-color: #93c5fd !important;
  }
}

.source-option-title {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.source-option-desc {
  min-width: 0;
  overflow: hidden;
  color: #94a3b8;
  font-size: 10px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-content {
  height: 240px;
  background: #282d36;
}

.picker-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 72px;
  padding: 14px;
}

.picker-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.required-mark {
  color: #ef4444;
  font-size: 11px;
  font-weight: 400;
}

.picker-content :deep(.generic-picker-container) {
  width: min(420px, 70%);
  flex: 0 1 420px;
}

@media (max-width: 640px) {
  .program-identity {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .picker-content {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .picker-content :deep(.generic-picker-container) {
    width: 100%;
    flex-basis: auto;
  }

  .editor-content {
    height: 200px;
  }
}
</style>
