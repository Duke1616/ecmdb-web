<template>
  <CodebookPicker
    :model-value="selectedCodebookId"
    :project-id="projectId"
    :scope="projectScope"
    :disabled="!projectId || loading"
    display-path
    clearable
    :placeholder="projectEntryCodebookId ? '选择项目内文件' : '请先选择项目入口文件'"
    dialog-title="选择项目文件"
    dialog-description="从程序入口所属项目中选择运行时需要使用的文件"
    search-placeholder="搜索项目文件"
    empty-description="当前项目中没有可选文件"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { detailCodebookApi, treeCodebookApi } from "@/api/task/codebook"
import type { codebook, CodebookScope, WorkspaceNode } from "@/api/task/codebook/types/codebook"
import CodebookPicker from "@/common/components/CodebookPicker/index.vue"

const props = defineProps<{
  modelValue: string
  projectEntryCodebookId?: number
}>()
const emit = defineEmits<{
  (event: "update:modelValue", value: string): void
}>()

const files = ref<WorkspaceNode[]>([])
const projectId = ref<number>()
const projectScope = ref<CodebookScope>("TENANT")
const selectedCodebookId = ref<number>()
const loading = ref(false)
let requestVersion = 0

const flattenFiles = (nodes: WorkspaceNode[]): WorkspaceNode[] =>
  nodes.flatMap((node) => (node.kind === "FILE" ? [node] : flattenFiles(node.children || [])))

const syncSelection = () => {
  selectedCodebookId.value = files.value.find((file) => file.runtime_path === props.modelValue)?.source_id
}

watch(
  () => props.projectEntryCodebookId,
  async (entryCodebookId) => {
    const version = ++requestVersion
    files.value = []
    projectId.value = undefined
    selectedCodebookId.value = undefined
    if (!entryCodebookId) return

    loading.value = true
    try {
      const { data: entry } = await detailCodebookApi(entryCodebookId)
      const { data: workspace } = await treeCodebookApi(entry.project_id, entry.scope)
      if (version !== requestVersion) return
      projectId.value = entry.project_id
      projectScope.value = entry.scope
      const projectRoot = workspace.nodes.find((node) => node.layer === "PROJECT")
      files.value = flattenFiles(projectRoot?.children || [])
      syncSelection()
    } catch (error) {
      if (version === requestVersion) console.error("加载项目文件失败", error)
    } finally {
      if (version === requestVersion) loading.value = false
    }
  },
  { immediate: true }
)

watch(() => props.modelValue, syncSelection)

function handleChange(file: codebook | null) {
  selectedCodebookId.value = file?.id
  emit("update:modelValue", file?.runtime_path || "")
}
</script>
