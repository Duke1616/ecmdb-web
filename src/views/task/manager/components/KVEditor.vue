<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { Delete, Plus } from "@element-plus/icons-vue"

interface KVItem {
  key: string
  value: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: Record<string, string>
    titleKey?: string
    titleValue?: string
    addText?: string
    emptyText?: string
  }>(),
  {
    modelValue: () => ({}),
    titleKey: "字段名 (KEY)",
    titleValue: "字段值 (VALUE)",
    addText: "添加字典项...",
    emptyText: "暂未配置任何字典项"
  }
)

const emit = defineEmits<{
  "update:modelValue": [val: Record<string, string>]
}>()

const list = ref<KVItem[]>([])

const parseModelToList = (val: Record<string, string>): KVItem[] => {
  const resultList: KVItem[] = []
  if (val && typeof val === "object" && !Array.isArray(val)) {
    Object.entries(val).forEach(([k, v]) => {
      resultList.push({ key: k, value: String(v) })
    })
  }
  return resultList
}

const syncToParent = () => {
  const result: Record<string, string> = {}
  list.value.forEach((item) => {
    if (item.key.trim() !== "") {
      result[item.key.trim()] = String(item.value)
    }
  })
  emit("update:modelValue", result)
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (Object.keys(newVal || {}).length !== list.value.filter((i) => i.key).length) {
      list.value = parseModelToList(newVal || {})
    }
  },
  { deep: true }
)

const addItem = () => {
  list.value.push({ key: "", value: "" })
}

const removeItem = (index: number) => {
  list.value.splice(index, 1)
  syncToParent()
}

onMounted(() => {
  if (props.modelValue) {
    list.value = parseModelToList(props.modelValue)
  }
})
</script>

<template>
  <div class="kv-editor">
    <div v-if="list.length > 0" class="map-header">
      <div class="label-key">{{ titleKey }}</div>
      <div class="label-value">{{ titleValue }}</div>
    </div>

    <div class="map-list" v-if="list.length > 0">
      <div v-for="(item, index) in list" :key="index" class="map-item-row">
        <div class="item-main">
          <el-input v-model="item.key" placeholder="Key..." class="minimal-input key-field" @blur="syncToParent" />
          <div class="item-divider">:</div>
          <el-input
            v-model="item.value"
            placeholder="Value..."
            class="minimal-input value-field"
            @blur="syncToParent"
          />
        </div>
        <div class="item-actions">
          <el-button type="danger" link :icon="Delete" @click="removeItem(index)" class="delete-btn" />
        </div>
      </div>
    </div>

    <div class="map-footer">
      <div class="add-trigger" @click="addItem">
        <el-icon><Plus /></el-icon>
        <span>{{ addText }}</span>
      </div>
      <transition name="fade">
        <div v-if="list.length === 0" class="empty-status">{{ emptyText }}</div>
      </transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kv-editor {
  display: flex;
  flex-direction: column;
}

.map-header {
  display: flex;
  gap: 12px;
  padding: 0 4px 6px;

  div {
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }
  .label-key {
    width: 140px;
  }
  .label-value {
    flex: 1;
  }
}

.map-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.map-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideIn 0.2s ease-out;

  .item-main {
    flex: 1;
    display: flex;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #eef2f6;
    border-radius: 6px;
    padding: 2px 8px;
    transition: all 0.2s;

    &:hover,
    &:focus-within {
      background: #ffffff;
      border-color: #cbd5e1;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
  }

  .item-divider {
    color: #cbd5e1;
    font-weight: bold;
    margin: 0 4px;
    font-size: 12px;
  }
}

.minimal-input {
  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    border: none !important;
  }

  :deep(input) {
    height: 28px;
    font-size: 13px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #1e293b;

    &::placeholder {
      color: #cbd5e1;
    }
  }

  &.key-field {
    width: 140px;
    :deep(input) {
      font-weight: 600;
      color: #475569;
    }
  }

  &.value-field {
    flex: 1;
  }
}

.delete-btn {
  padding: 4px;
  font-size: 16px;
  color: #94a3b8;
  &:hover {
    color: #ef4444;
  }
}

.map-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.add-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  transition: all 0.2s;
  width: 100%;

  &:hover {
    background: #f1f5f9;
    color: #3b82f6;
    border-color: #93c5fd;
  }
}

.empty-status {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  padding-bottom: 4px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
