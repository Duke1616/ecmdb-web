<template>
  <SearchSelectorBase
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :variant="variant"
    :load-data="loadRunners"
    :get-item-by-id="getRunnerById"
    id-field="id"
    item-name-field="name"
    item-description-field="desc"
    search-placeholder="搜索执行单元..."
    empty-text="未找到匹配的执行单元"
    :page-size="20"
    @update:model-value="handleUpdate"
  >
    <!-- 自定义描述显示 -->
    <template #description="{ item }">
      <div class="runner-extra">
        <el-tag size="small" type="success" effect="plain" v-if="item.kind">{{ item.kind }}</el-tag>
        <span class="runner-target">{{ item.target }}</span>
        <span class="runner-handler" v-if="item.handler">{{ item.handler }}</span>
      </div>
    </template>

    <!-- 元数据 -->
    <template #meta />
  </SearchSelectorBase>
</template>

<script setup lang="ts">
import SearchSelectorBase from "./Base.vue"
import { listRunnerApi, listRunnerByIdsApi } from "@/api/runner"

interface Props {
  modelValue?: number
  placeholder?: string
  disabled?: boolean
  variant?: "fancy" | "simple"
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: "请选择执行单元",
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
const loadRunners = async (params: any) => {
  const req = { offset: params.offset, limit: params.limit, keyword: params.keyword }
  const response = await listRunnerApi(req as any)
  return response
}

// 定义获取单个详情函数
const getRunnerById = async (id: number) => {
  const response = await listRunnerByIdsApi([id])
  if (response.data && response.data.runners && response.data.runners.length > 0) {
    return {
      ...response,
      data: response.data.runners[0]
    }
  }
  return response
}
</script>

<style scoped>
.runner-extra {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.runner-target,
.runner-handler {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: #94a3b8;
}
.runner-target {
  font-weight: 500;
}
.runner-handler {
  color: #fb923c;
}
</style>
