<template>
  <GenericPicker
    v-model="model"
    :placeholder="placeholder"
    search-placeholder="搜索工单模板..."
    :multiple="multiple"
    :variant="variant"
    :search-api="searchApi"
    :resolve-api="resolveApi"
    key-field="id"
    label-field="name"
    :fallback-builder="fallbackBuilder"
    :disabled="disabled"
  >
    <!-- 下拉选项的定制渲染（展示模板名称和描述） -->
    <template #item="{ item }">
      <div class="template-item-option">
        <div class="template-name">{{ item.name }}</div>
        <div class="template-desc" v-if="item.desc">{{ item.desc }}</div>
      </div>
    </template>
  </GenericPicker>
</template>

<script lang="ts" setup>
import { listTemplateApi, detailTemplateApi } from "@/api/ticket/template"
import type { template as ITicketTemplate } from "@/api/ticket/template/types/template"
import GenericPicker from "@/common/components/GenericPicker/index.vue"

interface ITicketTemplatePickerProps {
  placeholder?: string
  multiple?: boolean
  variant?: "fancy" | "simple" | "element"
  disabled?: boolean
}

withDefaults(defineProps<ITicketTemplatePickerProps>(), {
  placeholder: "请选择工单模板",
  multiple: false,
  variant: "fancy",
  disabled: false
})

// NOTE: 该组件为纯通用 UI 选择控制组件，通过 v-model 将选中的工单模板 ID 双向绑定同步给外部
const model = defineModel<number | number[]>()

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const { data } = await listTemplateApi({
    keyword: params.keyword,
    offset: params.offset,
    limit: params.limit
  })
  return {
    total: data.total || 0,
    data: data.templates || []
  }
}

const resolveApi = async (id: number): Promise<ITicketTemplate | null> => {
  const { data } = await detailTemplateApi(id)
  return data || null
}

const fallbackBuilder = (id: number): ITicketTemplate => {
  return {
    id: id,
    name: `模板 #${id}`,
    rules: null,
    options: null,
    create_type: 0,
    desc: "",
    icon: "",
    workflow_id: 0,
    group_id: 0
  }
}
</script>

<style lang="scss" scoped>
.template-item-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.template-desc {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style>
