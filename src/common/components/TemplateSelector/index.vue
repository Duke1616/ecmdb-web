<template>
  <SearchSelectorBase
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :variant="variant"
    :load-data="loadTemplates"
    id-field="id"
    item-name-field="name"
    item-description-field="desc"
    search-placeholder="搜索模板..."
    empty-text="未找到匹配的模板"
    :page-size="5"
    @update:model-value="handleUpdate"
  >
    <!-- 自定义描述显示 -->
    <template #description="{ item }">{{ item.desc }}</template>

    <!-- 自定义元数据显示 -->
    <template #meta="{ item }">
      <el-tag size="small" v-if="item.group_id">分组 #{{ item.group_id }}</el-tag>
      <el-tag size="small" v-if="item.workflow_id">工作流 #{{ item.workflow_id }}</el-tag>
    </template>
  </SearchSelectorBase>
</template>

<script setup lang="ts">
import { withDefaults } from "vue"
import SearchSelectorBase from "../SearchSelectorBase/index.vue"
import { searchTemplateByKeywordApi } from "@/api/template"

interface Props {
  modelValue?: number
  placeholder?: string
  disabled?: boolean
  variant?: "fancy" | "simple"
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: "请选择模板",
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
const loadTemplates = async (params: any) => {
  return await searchTemplateByKeywordApi(params)
}
</script>
