<template>
  <SearchSelectorBase
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :variant="variant"
    :load-data="loadRules"
    :get-item-by-id="getRuleById"
    id-field="id"
    item-name-field="name"
    item-description-field="description"
    search-placeholder="搜索告警规则..."
    empty-text="未找到匹配的规则"
    :page-size="20"
    @update:model-value="handleUpdate"
  >
    <!-- 自定义描述显示 -->
    <template #description="{ item }">{{ item.description }}</template>

    <!-- 自定义元数据显示 -->
    <template #meta="{ item }">
      <el-tag :type="getLevelTagType(item.level)" size="small">
        {{ getLevelPriority(item.level) }}
      </el-tag>
      <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
        {{ item.enabled ? "已启用" : "已禁用" }}
      </el-tag>
    </template>
  </SearchSelectorBase>
</template>

<script setup lang="ts">
import { withDefaults } from "vue"
import SearchSelectorBase from "./Base.vue"
import { listRulesByKeywordApi, getRuleApi } from "@/api/alert/rule"

interface Props {
  modelValue?: number
  placeholder?: string
  disabled?: boolean
  variant?: "fancy" | "simple"
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: "请选择告警规则",
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
const loadRules = async (params: any) => {
  return await listRulesByKeywordApi(params)
}

// 定义获取单个规则详情函数
const getRuleById = async (id: number) => {
  return await getRuleApi(id)
}

// 获取告警级别优先级
const getLevelPriority = (level: number) => {
  const levels = ["", "P0", "P1", "P2", "P3", "P4"]
  return levels[level] || ""
}

// 获取告警级别标签类型
const getLevelTagType = (level: number) => {
  switch (level) {
    case 1:
    case 2:
      return "danger"
    case 3:
      return "warning"
    case 4:
    case 5:
      return "info"
    default:
      return "info"
  }
}
</script>
