<template>
  <SearchSelectorBase
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :variant="variant"
    :load-data="loadCodebooks"
    :get-item-by-id="getCodebookById"
    id-field="id"
    item-name-field="name"
    item-description-field="name"
    search-placeholder="搜索 Codebook..."
    empty-text="未找到匹配的项"
    :page-size="20"
    @update:model-value="handleUpdate"
  >
    <!-- 自定义描述显示 -->
    <template #description="{ item }">
      <div class="codebook-extra">
        <el-tag size="small" type="info" effect="plain">{{ inferLanguage(item.name) }}</el-tag>
        <span class="codebook-id">{{ item.name }}</span>
      </div>
    </template>

    <!-- 自定义元数据插槽（保持为空，因为 owner 不需要展示） -->
    <template #meta />
  </SearchSelectorBase>
</template>

<script setup lang="ts">
import SearchSelectorBase from "./Base.vue"
import { listCodebookApi, detailCodebookApi } from "@/api/task/codebook/index.js"

interface Props {
  modelValue?: number
  placeholder?: string
  disabled?: boolean
  variant?: "fancy" | "simple"
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: "请选择 Codebook",
  disabled: false,
  variant: "fancy"
})

const emit = defineEmits<{
  "update:modelValue": [value: number]
}>()

// 处理更新事件
const handleUpdate = (value: number) => {
  emit("update:modelValue", value)
}

const extLanguageMap: Record<string, string> = {
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  py: "python",
  js: "javascript",
  ts: "javascript",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown"
}

const getFileExt = (name: string) => String(name || "").match(/\.([^.]+)$/)?.[1]?.toLowerCase() || ""

const inferLanguage = (name: string) => extLanguageMap[getFileExt(name)] || "text"

// 定义数据加载函数
const loadCodebooks = async (params: any) => {
  const response = await listCodebookApi({
    offset: 0,
    limit: 200
  })
  if (response.data) {
    const keyword = String(params.keyword || "").trim().toLowerCase()
    const codebooks = (response.data.codebooks || []).filter((item: any) => {
      if (item.kind === "DIRECTORY") return false
      if (!keyword) return true
      return [item.name, item.owner, inferLanguage(item.name), getFileExt(item.name)].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword)
      )
    })
    const offset = Number(params.offset || 0)
    const limit = Number(params.limit || 20)
    return {
      ...response,
      data: {
        ...response.data,
        codebooks: codebooks.slice(offset, offset + limit),
        total: codebooks.length
      }
    }
  }
  return response
}

// 定义获取单个详情函数
const getCodebookById = async (id: string | number) => {
  const response = await detailCodebookApi(id as number)
  return response
}
</script>

<style scoped>
.codebook-extra {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.codebook-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: #94a3b8;
}
</style>
