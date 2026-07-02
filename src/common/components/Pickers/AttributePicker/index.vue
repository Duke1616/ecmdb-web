<template>
  <div class="attribute-picker">
    <el-input
      v-if="isManualMode"
      :model-value="modelValue"
      class="attribute-input"
      size="small"
      :placeholder="manualPlaceholder"
      @change="handleChange"
    />
    <GenericPicker
      v-else
      v-model="selectedFieldUid"
      :placeholder="placeholder"
      search-placeholder="搜索属性..."
      variant="element"
      :search-api="searchApi"
      :resolve-api="resolveApi"
      key-field="field_uid"
      label-field="field_name"
      :fallback-builder="fallbackBuilder"
      :dropdown-min-width="260"
      :page-size="pageSize"
      :show-pagination="showPagination"
      :show-loading="false"
      :container-class="attributePickerClass"
      dropdown-class="attribute-picker-dropdown"
    >
      <template #single="{ item }">
        <div class="attribute-single" :class="{ 'is-text': singleDisplay === 'text' }">
          <span>{{ item.field_name || item.field_uid }}</span>
          <small v-if="singleDisplay !== 'text'">{{ item.field_uid }}</small>
        </div>
      </template>

      <template #item="{ item }">
        <div class="attribute-option">
          <div class="attribute-option-copy">
            <span>{{ item.field_name || item.field_uid }}</span>
            <small>{{ item.field_uid }}</small>
          </div>
          <el-tag v-if="item.required" size="small" effect="plain">必填</el-tag>
        </div>
      </template>
    </GenericPicker>

    <el-tooltip v-if="!manualOnly" :content="isManualMode && modelUid ? '选择属性' : '手动输入'" placement="top">
      <button class="attribute-mode-btn" type="button" @click="toggleManualMode">
        <el-icon>
          <Tickets v-if="isManualMode && modelUid" />
          <EditPen v-else />
        </el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { EditPen, Tickets } from "@element-plus/icons-vue"
import type { Attribute } from "@/api/cmdb/attribute/types/attribute"
import GenericPicker from "@/common/components/Pickers/GenericPicker/index.vue"
import { getCachedModelAttributes } from "./cache"

const props = withDefaults(
  defineProps<{
    modelUid?: string
    modelValue?: string
    manualPlaceholder?: string
    manualOnly?: boolean
    pageSize?: number
    placeholder?: string
    showPagination?: boolean
    singleDisplay?: "full" | "text"
  }>(),
  {
    manualPlaceholder: "输入模型字段 UID",
    manualOnly: false,
    pageSize: 8,
    placeholder: "选择属性",
    showPagination: false,
    singleDisplay: "full"
  }
)

const emit = defineEmits<{
  change: [value: string]
  "update:modelValue": [value: string]
}>()

const manualMode = ref(false)

const isManualMode = computed(() => props.manualOnly || manualMode.value || !props.modelUid)

const selectedFieldUid = computed({
  get: () => props.modelValue || "",
  set: (value: string | number) => {
    emitValue(String(value))
  }
})

const attributePickerClass = computed(() =>
  ["attribute-generic-picker", props.singleDisplay === "text" ? "is-text-display" : ""].filter(Boolean).join(" ")
)

const emitValue = (value: string) => {
  emit("update:modelValue", value)
  emit("change", value)
}

const handleChange = (value: string | number) => {
  emitValue(String(value))
}

const loadAttributes = async () => {
  return getCachedModelAttributes(props.modelUid)
}

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const fields = await loadAttributes()
  const keyword = params.keyword.trim().toLowerCase()
  const filtered = keyword
    ? fields.filter((field) => {
        return field.field_uid.toLowerCase().includes(keyword) || field.field_name.toLowerCase().includes(keyword)
      })
    : fields

  return {
    total: filtered.length,
    data: filtered.slice(params.offset, params.offset + params.limit)
  }
}

const resolveApi = async (fieldUid: string) => {
  const fields = await loadAttributes()
  return fields.find((field) => field.field_uid === fieldUid) || null
}

const fallbackBuilder = (fieldUid: string): Attribute => {
  return {
    id: 0,
    group_id: 0,
    model_uid: props.modelUid || "",
    field_uid: fieldUid,
    field_name: fieldUid,
    field_type: "string",
    required: false,
    secure: false,
    link: false,
    option: null
  }
}

const toggleManualMode = () => {
  if (!props.modelUid) {
    manualMode.value = true
    return
  }
  manualMode.value = !manualMode.value
}

watch(
  () => props.modelUid,
  () => {
    manualMode.value = false
  }
)
</script>

<style scoped lang="scss">
.attribute-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.attribute-input,
:deep(.attribute-generic-picker) {
  min-width: 0;
  flex: 1;
}

:deep(.attribute-generic-picker.is-text-display .picker-input-box) {
  min-height: 30px;
  padding: 0 4px;
  background: transparent;
  border-color: transparent;
  border-radius: 6px;
  box-shadow: none;
}

:deep(.attribute-generic-picker.is-text-display .picker-input-box:hover),
:deep(.attribute-generic-picker.is-text-display .picker-input-box.is-focus) {
  background: #f8fafc;
  border-color: #e2e8f0;
  box-shadow: none;
}

:deep(.attribute-generic-picker.is-text-display .selected-single) {
  min-width: 0;
}

:deep(.attribute-generic-picker.is-text-display .picker-arrow) {
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.attribute-mode-btn {
  display: inline-flex;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d9e2ec;
  border-radius: 7px;
  transition:
    color 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;

  &:hover {
    color: #2563eb;
    background: #f8fbff;
    border-color: #93c5fd;
  }
}

.attribute-single,
.attribute-option,
.attribute-option-copy {
  display: flex;
  min-width: 0;
}

.attribute-single {
  width: 100%;
  flex-direction: column;
  line-height: 1.15;

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

  &.is-text {
    justify-content: center;

    span {
      color: #334155;
      font-size: 12px;
      font-weight: 600;
    }
  }
}

.attribute-option {
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.attribute-option-copy {
  flex-direction: column;
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
