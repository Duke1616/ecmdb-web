<template>
  <GenericPicker
    v-model="model"
    :placeholder="placeholder"
    search-placeholder="搜索脚本..."
    :multiple="multiple"
    :variant="variant"
    :search-api="searchApi"
    :resolve-api="resolveApi"
    key-field="id"
    label-field="name"
    container-class="codebook-picker"
    dropdown-class="codebook-picker-dropdown"
    :page-size="pageSize"
    :show-pagination="true"
    :show-loading="true"
    :disabled="disabled"
    :fallback-builder="fallbackBuilder"
  >
    <template #tag="{ item }">
      <img class="codebook-icon size-tag" :src="getCodebookIcon(item.name)" alt="" />
      <span class="codebook-name">{{ item.name }}</span>
    </template>

    <template #single="{ item }">
      <img class="codebook-icon size-single" :src="getCodebookIcon(item.name)" alt="" />
      <span class="codebook-name">{{ item.name }}</span>
    </template>

    <template #item="{ item }">
      <img class="codebook-icon size-item" :src="getCodebookIcon(item.name)" alt="" />
      <div class="codebook-info">
        <div class="codebook-title">
          <span class="codebook-name">{{ item.name }}</span>
        </div>
        <div class="codebook-meta">
          <span>{{ item.owner || "未设置负责人" }}</span>
          <span v-if="item.id">#{{ item.id }}</span>
        </div>
      </div>
    </template>
  </GenericPicker>
</template>

<script setup lang="ts">
import { computed } from "vue"
import GenericPicker from "@/common/components/GenericPicker/index.vue"
import { detailCodebookApi, listCodebookApi } from "@/api/task/codebook"
import type { CodebookKind, CodebookScope, codebook } from "@/api/task/codebook/types/codebook"
import fileIcon from "@/common/assets/icons/preserve-color/file.svg"
import pythonIcon from "@/common/assets/icons/preserve-color/python.svg"
import shellIcon from "@/common/assets/icons/preserve-color/shell.svg"

interface CodebookPickerProps {
  placeholder?: string
  multiple?: boolean
  variant?: "fancy" | "simple" | "element"
  pageSize?: number
  projectId?: number
  scope?: CodebookScope | ""
  includeDirectories?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<CodebookPickerProps>(), {
  placeholder: "请选择脚本",
  multiple: false,
  variant: "element",
  pageSize: 10,
  projectId: undefined,
  scope: "",
  includeDirectories: false,
  disabled: false
})

const model = defineModel<number | number[]>()

const extLanguageMap: Record<string, string> = {
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  py: "python",
  js: "javascript",
  ts: "typescript",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown"
}

const getFileExt = (name: string) => String(name || "").match(/\.([^.]+)$/)?.[1]?.toLowerCase() || ""

const inferLanguage = (name: string) => extLanguageMap[getFileExt(name)] || "text"

const getCodebookIcon = (name: string) => {
  const language = inferLanguage(name)
  if (language === "python") return pythonIcon
  if (language === "shell") return shellIcon
  return fileIcon
}

const shouldShowCodebook = (item: codebook, keyword: string) => {
  if (!props.includeDirectories && item.kind === "DIRECTORY") return false
  if (props.projectId && item.project_id !== props.projectId) return false
  if (props.scope && item.scope !== props.scope) return false
  if (!keyword) return true

  return [item.name, item.owner, inferLanguage(item.name), getFileExt(item.name), item.id].some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(keyword)
  )
}

const loadAllLimit = computed(() => Math.max(200, props.pageSize * 20))

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const keyword = params.keyword.trim().toLowerCase()
  const { data } = await listCodebookApi({
    offset: 0,
    limit: loadAllLimit.value
  })
  const list = (data.codebooks || []).filter((item) => shouldShowCodebook(item, keyword))

  return {
    total: list.length,
    data: list.slice(params.offset, params.offset + params.limit)
  }
}

const resolveApi = async (id: number): Promise<codebook | null> => {
  const { data } = await detailCodebookApi(id)
  return data
}

const fallbackBuilder = (id: number): codebook => ({
  id,
  tenant_id: 0,
  project_id: props.projectId || 0,
  scope: props.scope || "TENANT",
  parent_id: 0,
  path_ids: "",
  depth: 0,
  name: `脚本 #${id}`,
  owner: "",
  kind: "FILE" as CodebookKind,
  sort_no: 0,
  code: "",
  secret: "",
  current_version_id: 0,
  ctime: 0,
  utime: 0
})
</script>

<style scoped lang="scss">
.codebook-icon {
  flex-shrink: 0;
  object-fit: contain;
}

.size-single {
  width: 20px;
  height: 20px;
}

.size-tag {
  width: 16px;
  height: 16px;
}

.size-item {
  width: 30px;
  height: 30px;
}

.codebook-name {
  min-width: 0;
  overflow: hidden;
  color: #303133;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.codebook-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.codebook-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.codebook-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 11px;
}

:deep(.codebook-picker.variant-simple .picker-input-box),
:deep(.codebook-picker.variant-element .picker-input-box) {
  background: #ffffff !important;
}

:global(.codebook-picker-dropdown .list-item) {
  align-items: center;
  gap: 10px;
}

:global(.codebook-picker-dropdown .list-item:hover),
:global(.codebook-picker-dropdown .list-item.is-selected) {
  background: #f5f7fa;
}

:global(.codebook-picker-dropdown .selected-indicator) {
  color: #606266;
}
</style>
