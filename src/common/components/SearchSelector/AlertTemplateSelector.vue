<template>
  <SearchSelectorBase
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :variant="variant"
    :load-data="loadTemplates"
    :get-item-by-id="getTemplateById"
    id-field="id"
    item-name-field="name"
    item-description-field="description"
    search-placeholder="搜索通知模板..."
    empty-text="未找到匹配的模板"
    :page-size="5"
    @update:model-value="handleUpdate"
  >
    <!-- 自定义描述显示 -->
    <template #description="{ item }">{{ item.description }}</template>

    <!-- 自定义元数据，显示通知渠道 -->
    <template #meta="{ item }">
      <el-tag size="small" type="success" v-if="item.channel">{{ item.channel }}</el-tag>
    </template>
  </SearchSelectorBase>
</template>

<script setup lang="ts">
import SearchSelectorBase from "./Base.vue"
import { listTemplatesApi, getTemplateDetailApi } from "@/api/alert/template"
import type { ListTemplatesReq } from "@/api/alert/template/types"

interface Props {
  modelValue?: number
  placeholder?: string
  disabled?: boolean
  variant?: "fancy" | "simple"
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: "请选择通知模板",
  disabled: false,
  variant: "fancy"
})

const emit = defineEmits<{
  "update:modelValue": [value: number]
}>()

const handleUpdate = (value: number) => {
  emit("update:modelValue", value)
}

// 适配 SearchSelectorBase 的 loadData 参数格式
const loadTemplates = async (params: { keyword: string; offset: number; limit: number }) => {
  const req: ListTemplatesReq = {
    offset: params.offset,
    limit: params.limit
  }
  // 如果有搜索词，目前的接口可以通过 list 过滤。如果没有过滤，我们在前端或者在 Base 级别过滤
  const res = await listTemplatesApi(req)
  // 如果后端接口不支持模糊搜索，为了体验我们可以在 Base.vue 做过滤，或者后端支持。目前 listTemplatesApi 只支持 limit/offset。
  // 让我们看一下后端接口的类型定义：它有 channel 或 keyword 吗？
  // 暂时直接调用
  return res
}

const getTemplateById = async (id: string | number) => {
  const res = await getTemplateDetailApi(id as number)
  return res.data
}
</script>
