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
    item-description-field="identifier"
    search-placeholder="搜索 Codebook..."
    empty-text="未找到匹配的项"
    :page-size="20"
    @update:model-value="handleUpdate"
  >
    <!-- 自定义描述显示 -->
    <template #description="{ item }">
      <div class="codebook-extra">
        <el-tag size="small" type="info" effect="plain">{{ item.language }}</el-tag>
        <span class="codebook-id">{{ item.identifier }}</span>
      </div>
    </template>

    <!-- 自定义元数据插槽（保持为空，因为 owner 不需要展示） -->
    <template #meta />
  </SearchSelectorBase>
</template>

<script setup lang="ts">
import SearchSelectorBase from "./Base.vue"
import { listCodebookApi, detailCodebookApi } from "@/api/codebook"

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

// 定义数据加载函数
const loadCodebooks = async (params: any) => {
  const response = await listCodebookApi(params)
  return response
}

// 定义获取单个详情函数
const getCodebookById = async (id: number) => {
  const response = await detailCodebookApi(id)
  if (response.data && response.data.codebooks && response.data.codebooks.length > 0) {
    return {
      ...response,
      data: response.data.codebooks[0]
    }
  }
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
