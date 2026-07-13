<template>
  <div
    class="tenant-picker-shell"
    :class="{ 'has-clear-value': clearable && pickerValue !== undefined && pickerValue !== null }"
  >
    <GenericPicker
      v-model="pickerValue"
      :placeholder="placeholder"
      :search-placeholder="searchPlaceholder"
      :search-api="searchApi"
      :resolve-api="resolveApi"
      :fallback-builder="fallbackBuilder"
      :variant="variant"
      :disabled="disabled"
      :page-size="pageSize"
      :show-pagination="showPagination"
      :container-class="containerClass"
      :size="size"
      key-field="id"
      label-field="name"
      dropdown-class="tenant-picker-dropdown"
    >
      <template #single="{ item }">
        <div class="tenant-single">
          <span class="tenant-name">{{ item.name }}</span>
        </div>
      </template>

      <template #item="{ item }">
        <div class="tenant-option">
          <span class="tenant-name">{{ item.name }}</span>
        </div>
      </template>
    </GenericPicker>

    <button
      v-if="clearable && pickerValue !== undefined && pickerValue !== null"
      class="clear-btn"
      type="button"
      title="清空"
      :disabled="disabled"
      @click.stop="clearValue"
    >
      <el-icon><CircleClose /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import GenericPicker from "../GenericPicker/index.vue"
import { CircleClose } from "@element-plus/icons-vue"

export interface TenantPickerOption {
  id: number
  name?: string
  code?: string
  domain?: string
}

export interface TenantPickerEntity {
  id: number
  name: string
  code: string
  domain: string
}

export type TenantPickerValue = number | string | undefined

const props = withDefaults(
  defineProps<{
    tenants: TenantPickerOption[]
    placeholder?: string
    searchPlaceholder?: string
    variant?: "fancy" | "simple" | "element"
    allowCreate?: boolean
    clearable?: boolean
    disabled?: boolean
    pageSize?: number
    showPagination?: boolean
    size?: "" | "small" | "default" | "large"
  }>(),
  {
    placeholder: "租户 ID / 名称",
    searchPlaceholder: "搜索租户名称、编码或 ID...",
    variant: "fancy",
    allowCreate: true,
    clearable: false,
    disabled: false,
    pageSize: 8,
    showPagination: false,
    size: ""
  }
)

const emit = defineEmits<{
  change: []
}>()

const model = defineModel<TenantPickerValue>({ required: true })

const pickerValue = computed<number | undefined>({
  get: () => normalizeTenantId(model.value),
  set: (value) => {
    model.value = value
    emit("change")
  }
})

const tenantItems = computed<TenantPickerEntity[]>(() =>
  props.tenants.map((tenant) => buildTenantEntity(tenant.id, tenant))
)
const containerClass = computed(() => "")

const normalizeTenantId = (value: TenantPickerValue) => {
  const tenantId = Number(value)
  return Number.isFinite(tenantId) && tenantId > 0 ? tenantId : undefined
}

const buildTenantEntity = (id: number, source?: TenantPickerOption): TenantPickerEntity => {
  const name = source?.name || source?.code || source?.domain || `租户 ${id}`
  return {
    id,
    name,
    code: source?.code || "",
    domain: source?.domain || ""
  }
}

const fallbackBuilder = (id: number): TenantPickerEntity => buildTenantEntity(id)

const resolveApi = async (id: number) => {
  return tenantItems.value.find((tenant) => Number(tenant.id) === Number(id)) || fallbackBuilder(id)
}

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const keyword = params.keyword.trim().toLowerCase()
  const matched = keyword
    ? tenantItems.value.filter((tenant) => {
        return (
          tenant.name.toLowerCase().includes(keyword) ||
          tenant.code.toLowerCase().includes(keyword) ||
          tenant.domain.toLowerCase().includes(keyword) ||
          String(tenant.id).includes(keyword)
        )
      })
    : tenantItems.value

  const keywordTenantId = normalizeTenantId(keyword)
  const shouldAppendManual =
    props.allowCreate && keywordTenantId && !matched.some((tenant) => Number(tenant.id) === keywordTenantId)
  const data = shouldAppendManual ? [fallbackBuilder(keywordTenantId), ...matched] : matched

  return {
    total: data.length,
    data: data.slice(params.offset, params.offset + params.limit)
  }
}

const clearValue = () => {
  if (props.disabled) return
  model.value = undefined
  emit("change")
}
</script>

<style scoped lang="scss">
.tenant-picker-shell {
  position: relative;
  width: 100%;
}

.tenant-single,
.tenant-option {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}

.tenant-single,
.tenant-option {
  flex: 1;
  width: 100%;
}

.tenant-name {
  max-width: 100%;
  overflow: hidden;
  color: #606266;
  font-size: 14px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clear-btn {
  position: absolute;
  top: 50%;
  right: 11px;
  z-index: 2;
  width: var(--el-input-icon-size, 14px);
  height: var(--el-input-icon-size, 14px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--el-text-color-placeholder);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%);
  transition:
    color 0.16s,
    opacity 0.16s;

  .el-icon {
    font-size: var(--el-input-icon-size, 14px);
  }

  &:hover {
    color: var(--el-text-color-secondary);
  }
}

.tenant-picker-shell.has-clear-value:hover,
.tenant-picker-shell.has-clear-value:focus-within {
  .clear-btn {
    opacity: 1;
    pointer-events: auto;
  }

  :deep(.picker-arrow) {
    opacity: 0;
  }
}
</style>
