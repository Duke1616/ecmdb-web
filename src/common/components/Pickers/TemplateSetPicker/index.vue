<template>
  <GenericPicker
    v-model="model"
    :placeholder="placeholder"
    search-placeholder="搜索模板集..."
    :multiple="multiple"
    :variant="variant"
    :search-api="searchApi"
    :resolve-api="resolveApi"
    key-field="id"
    label-field="name"
    :fallback-builder="fallbackBuilder"
    :disabled="disabled"
    :page-size="pageSize"
  >
    <template #item="{ item }">
      <div class="template-set-item-option">
        <div class="template-set-header">
          <span class="template-set-name">{{ item.name }}</span>
          <span class="template-set-meta">{{ item.items?.length || 0 }} 个渠道</span>
        </div>
        <div class="template-set-desc" v-if="item.description">{{ item.description }}</div>
      </div>
    </template>
  </GenericPicker>
</template>

<script lang="ts" setup>
import { getTemplateSetApi, listTemplateSetsApi } from "@/api/alert/template_set"
import type { TemplateSet } from "@/api/alert/template_set/types"
import GenericPicker from "@@/components/Pickers/GenericPicker/index.vue"

interface ITemplateSetPickerProps {
  placeholder?: string
  multiple?: boolean
  variant?: "fancy" | "simple" | "element"
  disabled?: boolean
  pageSize?: number
}

withDefaults(defineProps<ITemplateSetPickerProps>(), {
  placeholder: "请选择模板集",
  multiple: false,
  variant: "fancy",
  disabled: false,
  pageSize: 10
})

const model = defineModel<number | number[]>()

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const { data } = await listTemplateSetsApi({
    keyword: params.keyword,
    offset: params.offset,
    limit: params.limit
  })
  return {
    total: data.total || 0,
    data: data.template_sets || []
  }
}

const resolveApi = async (id: number): Promise<TemplateSet | null> => {
  const { data } = await getTemplateSetApi(id)
  return data?.template_set || null
}

const fallbackBuilder = (id: number): TemplateSet => {
  return {
    id,
    owner_id: 0,
    name: `模板集 #${id}`,
    description: "",
    ctime: 0,
    utime: 0,
    items: []
  }
}
</script>

<style lang="scss" scoped>
.template-set-item-option {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.template-set-header {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}

.template-set-name {
  min-width: 0;
  overflow: hidden;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-set-meta {
  flex-shrink: 0;
  color: #64748b;
  font-size: 11px;
}

.template-set-desc {
  width: 100%;
  overflow: hidden;
  color: #6b7280;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

