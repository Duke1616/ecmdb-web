<template>
  <div class="model-picker-wrapper">
    <GenericPicker
      v-model="selectedModelUid"
      :placeholder="placeholder"
      search-placeholder="搜索模型..."
      variant="element"
      :search-api="searchApi"
      :resolve-api="resolveApi"
      key-field="uid"
      label-field="name"
      :fallback-builder="fallbackBuilder"
      :dropdown-min-width="260"
      :page-size="pageSize"
      :show-pagination="showPagination"
      :show-loading="false"
      container-class="model-picker"
      dropdown-class="model-picker-dropdown"
    >
      <template #single="{ item }">
        <div class="model-single">
          <AppIcon :name="item.icon" fallback="Box" class="model-icon" />
          <span>{{ item.name || item.uid }}</span>
        </div>
      </template>

      <template #item="{ item }">
        <div class="model-option">
          <AppIcon :name="item.icon" fallback="Box" class="model-icon" />
          <div class="model-option-copy">
            <span>{{ item.name || item.uid }}</span>
            <small>{{ item.uid }}</small>
          </div>
        </div>
      </template>
    </GenericPicker>

    <div v-if="selectedModelIsAutoCreate" class="model-create-hint">保存后自动创建</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import AppIcon from "@/common/components/AppIcon/index.vue"
import GenericPicker from "@/common/components/Pickers/GenericPicker/index.vue"

export interface ModelPickerOption {
  uid: string
  name?: string
  icon?: string
  group_name?: string
  builtin?: boolean
}

const props = withDefaults(
  defineProps<{
    autoCreateGroupLabel?: string
    modelValue?: string
    models: ModelPickerOption[]
    pageSize?: number
    placeholder?: string
    showPagination?: boolean
  }>(),
  {
    autoCreateGroupLabel: "保存后自动创建",
    pageSize: 8,
    placeholder: "选择模型",
    showPagination: false
  }
)

const emit = defineEmits<{
  change: [value: string]
  "update:modelValue": [value: string]
}>()

const selectedModelUid = computed({
  get: () => props.modelValue || "",
  set: (value: string | number) => {
    const nextValue = String(value)
    emit("update:modelValue", nextValue)
    emit("change", nextValue)
  }
})

const selectedModel = computed(() => props.models.find((model) => model.uid === props.modelValue))

const selectedModelIsAutoCreate = computed(() => selectedModel.value?.group_name === props.autoCreateGroupLabel)

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const keyword = params.keyword.trim().toLowerCase()
  const filtered = keyword
    ? props.models.filter((model) => {
        const name = model.name || ""
        return model.uid.toLowerCase().includes(keyword) || name.toLowerCase().includes(keyword)
      })
    : props.models

  return {
    total: filtered.length,
    data: filtered.slice(params.offset, params.offset + params.limit)
  }
}

const resolveApi = async (uid: string) => props.models.find((model) => model.uid === uid) || null

const fallbackBuilder = (uid: string): ModelPickerOption => {
  return {
    uid,
    name: uid,
    group_name: props.autoCreateGroupLabel,
    builtin: false
  }
}
</script>

<style scoped lang="scss">
.model-picker-wrapper,
:deep(.model-picker) {
  width: 100%;
}

.model-picker-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.model-single,
.model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.model-single {
  width: 100%;

  span {
    overflow: hidden;
    color: #0f172a;
    font-size: 12px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.model-icon {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  color: #2563eb;
}

.model-create-hint {
  color: #64748b;
  font-size: 11px;
  line-height: 1.4;
}

.model-option-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;

  span,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: #0f172a;
    font-size: 12px;
    font-weight: 700;
  }

  small {
    margin-top: 2px;
    color: #94a3b8;
    font-size: 11px;
  }
}
</style>
