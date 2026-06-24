<template>
  <SearchSelectorBase
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :variant="variant"
    :load-data="loadConfigs"
    :get-item-by-id="getConfigById"
    id-field="id"
    item-name-field="name"
    item-description-field="description"
    search-placeholder="搜索升级配置..."
    empty-text="未找到匹配的升级配置"
    :page-size="5"
    @update:model-value="handleUpdate"
  >
    <!-- 自定义描述显示 -->
    <template #description="{ item }">{{ item.description }}</template>

    <!-- 自定义元数据，显示状态 -->
    <template #meta="{ item }">
      <el-tag size="small" :type="item.enabled ? 'success' : 'info'">
        {{ item.enabled ? "已启用" : "已禁用" }}
      </el-tag>
    </template>
  </SearchSelectorBase>
</template>

<script setup lang="ts">
import SearchSelectorBase from "./Base.vue"
import { listConfigsApi, getConfigApi } from "@/api/alert/escalation"
import type { ListConfigsReq } from "@/api/alert/escalation/types"

interface Props {
  modelValue?: number
  placeholder?: string
  disabled?: boolean
  variant?: "fancy" | "simple"
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: "请选择升级配置",
  disabled: false,
  variant: "fancy"
})

const emit = defineEmits<{
  "update:modelValue": [value: number]
}>()

const handleUpdate = (value: number) => {
  emit("update:modelValue", value)
}

const loadConfigs = async (params: { keyword: string; offset: number; limit: number }) => {
  const req: ListConfigsReq = {
    offset: params.offset,
    limit: params.limit
  }
  const res = await listConfigsApi(req)
  return res
}

const getConfigById = async (id: string | number) => {
  const res = await getConfigApi(id as number)
  return res.data?.config
}
</script>
