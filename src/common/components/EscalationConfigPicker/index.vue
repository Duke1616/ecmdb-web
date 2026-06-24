<template>
  <GenericPicker
    v-model="model"
    :placeholder="placeholder"
    search-placeholder="搜索升级配置..."
    :multiple="multiple"
    :variant="variant"
    :search-api="searchApi"
    :resolve-api="resolveApi"
    key-field="id"
    label-field="name"
    :fallback-builder="fallbackBuilder"
    :disabled="disabled"
  >
    <!-- 下拉选项的定制渲染（展示配置名称、描述和启用状态） -->
    <template #item="{ item }">
      <div class="config-item-option">
        <div class="config-item-header">
          <span class="config-name">{{ item.name }}</span>
          <el-tag size="small" :type="item.enabled ? 'success' : 'info'" class="status-tag">
            {{ item.enabled ? "已启用" : "已禁用" }}
          </el-tag>
        </div>
        <div class="config-desc" v-if="item.description">{{ item.description }}</div>
      </div>
    </template>
  </GenericPicker>
</template>

<script lang="ts" setup>
import { getConfigApi, listConfigsApi } from "@/api/alert/escalation"
import type { ConfigVO as IEscalationConfig } from "@/api/alert/escalation/types"
import GenericPicker from "@/common/components/GenericPicker/index.vue"

interface IEscalationConfigPickerProps {
  placeholder?: string
  multiple?: boolean
  variant?: "fancy" | "simple" | "element"
  disabled?: boolean
}

withDefaults(defineProps<IEscalationConfigPickerProps>(), {
  placeholder: "请选择升级配置",
  multiple: false,
  variant: "fancy",
  disabled: false
})

// NOTE: 该组件为纯通用 UI 选择控制组件，通过 v-model 将选中的升级配置 ID 双向绑定同步给外部
const model = defineModel<number | number[]>()

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const { data } = await listConfigsApi({
    offset: params.offset,
    limit: params.limit
  })
  return {
    total: data.total || 0,
    data: data.configs || []
  }
}

const resolveApi = async (id: number): Promise<IEscalationConfig | null> => {
  const { data } = await getConfigApi(id)
  return data?.config || null
}

const fallbackBuilder = (id: number): IEscalationConfig => {
  return {
    id: id,
    name: `升级配置 #${id}`,
    description: "",
    enabled: false,
    timeout: 0,
    triggers: [],
    trigger_logic: {
      type: "",
      expression: "",
      description: ""
    },
    steps: [],
    created_by: "",
    ctime: 0,
    utime: 0
  }
}
</script>

<style lang="scss" scoped>
.config-item-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.config-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
  width: 100%;
}

.config-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.status-tag {
  flex-shrink: 0;
}

.config-desc {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style>
