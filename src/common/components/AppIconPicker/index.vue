<template>
  <el-popover
    v-model:visible="visible"
    trigger="click"
    placement="bottom-start"
    :width="popoverWidth"
    popper-class="app-icon-picker-popper"
    :teleported="true"
  >
    <template #reference>
      <button
        ref="triggerRef"
        type="button"
        class="app-icon-picker-trigger"
        :class="{ 'is-focus': visible, 'is-empty': !modelValue }"
      >
        <span class="trigger-icon">
          <AppIcon :name="modelValue" :fallback="fallback" />
        </span>
        <span class="trigger-label">{{ selectedLabel }}</span>
        <span class="trigger-arrow" :class="{ 'is-open': visible }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
    </template>

    <div class="app-icon-picker">
      <div class="search-section">
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model="keyword" placeholder="搜索名称或关键字" class="search-input" />
        </div>
      </div>

      <div class="picker-body">
        <div class="source-tabs">
          <button
            v-for="item in appIconSourceOptions"
            :key="item.value"
            type="button"
            class="source-tab"
            :class="{ active: activeSource === item.value }"
            @click="activeSource = item.value"
          >
            {{ item.label }}
          </button>
        </div>

        <div v-if="activeSource === 'image'" class="image-panel">
          <div class="image-input-wrapper">
            <input
              v-model="imageUrl"
              placeholder="请输入图片 URL 或 Base64"
              class="image-input"
              @change="selectImage"
            />
            <button v-if="imageUrl" type="button" class="image-clear-btn" title="清空" @click="clearImageUrl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div v-if="imageUrl" class="image-preview">
            <AppIcon :name="imageUrl" fallback="Picture" class="image-preview-icon" />
            <span>{{ imageUrl }}</span>
          </div>
        </div>

        <div v-else class="picker-icon-grid">
          <button
            v-for="option in filteredOptions"
            :key="`${option.source}:${option.value}`"
            type="button"
            class="picker-icon-option"
            :class="{ active: modelValue === option.value }"
            :title="option.label"
            @click="selectIcon(option.value)"
          >
            <AppIcon :name="option.value" class="option-icon" />
          </button>
          <div v-if="filteredOptions.length === 0" class="picker-icon-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span>暂无匹配图标</span>
          </div>
        </div>
      </div>

      <div class="picker-footer">
        <div class="selected-preview">
          <span class="selected-icon">
            <AppIcon :name="modelValue" :fallback="fallback" />
          </span>
          <div class="selected-info">
            <span class="selected-label">{{ selectedLabel }}</span>
            <code>{{ selectedValueText }}</code>
          </div>
        </div>
        <el-button link type="primary" :disabled="!modelValue" @click="clearIcon">清空</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import AppIcon from "@/common/components/AppIcon/index.vue"
import {
  appIconOptions,
  appIconOptionsBySource,
  appIconSourceOptions,
  filterAppIconOptions,
  getAppIconLabel
} from "../AppIcon/options"
import { isImageIcon } from "../AppIcon/utils"
import type { AppIconSource } from "../AppIcon/types"

const props = withDefaults(
  defineProps<{
    modelValue?: string
    fallback?: string
  }>(),
  {
    modelValue: "",
    fallback: "Document"
  }
)

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void
  (event: "change", value: string): void
}>()

const keyword = ref("")
const imageUrl = ref("")
const visible = ref(false)
const triggerRef = ref<HTMLButtonElement>()
const popoverWidth = ref(320)
const activeSource = ref<Exclude<AppIconSource, "empty" | "e-icon">>("element")
let resizeObserver: ResizeObserver | undefined

const selectedLabel = computed(() => getAppIconLabel(props.modelValue))
const selectedValueText = computed(() => props.modelValue || "尚未选择")

const filteredOptions = computed(() => {
  if (activeSource.value === "image") return []
  return filterAppIconOptions(appIconOptionsBySource[activeSource.value], keyword.value)
})

const emitValue = (value: string) => {
  emit("update:modelValue", value)
  emit("change", value)
}

const selectIcon = (value: string) => {
  emitValue(value)
  visible.value = false
}

const selectImage = () => {
  emitValue(imageUrl.value.trim())
}

const clearImageUrl = () => {
  imageUrl.value = ""
  emitValue("")
}

const clearIcon = () => {
  emitValue("")
}

const updatePopoverWidth = () => {
  const width = triggerRef.value?.getBoundingClientRect().width
  if (width) popoverWidth.value = Math.round(width)
}

watch(
  () => props.modelValue,
  (value) => {
    if (isImageIcon(value)) {
      activeSource.value = "image"
      imageUrl.value = value || ""
      return
    }

    const option = appIconOptions.find((item) => item.value === value)
    if (option) activeSource.value = option.source
  },
  { immediate: true }
)

watch(visible, async (value) => {
  if (!value) return
  await nextTick()
  updatePopoverWidth()
})

onMounted(() => {
  updatePopoverWidth()
  if (!triggerRef.value) return
  resizeObserver = new ResizeObserver(updatePopoverWidth)
  resizeObserver.observe(triggerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<style lang="scss">
.app-icon-picker-popper.el-popover {
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}
</style>

<style scoped lang="scss">
.app-icon-picker-trigger {
  display: inline-flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  color: #606266;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

  &:hover {
    border-color: #c0c4cc;
  }

  &.is-focus {
    border-color: #dcdfe6;
  }

  &.is-empty .trigger-label {
    color: #a8abb2;
  }
}

.trigger-icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #475569;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  font-size: 15px;
}

.trigger-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trigger-arrow {
  display: flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #a8abb2;
  transition: transform 0.3s ease;

  &.is-open {
    transform: rotate(180deg);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.app-icon-picker {
  display: flex;
  flex-direction: column;
}

.search-section {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  z-index: 1;
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  height: 34px;
  padding: 8px 12px 8px 36px;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  font-size: 13px;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #c0c4cc;
  box-shadow: none;
}

.search-input::placeholder {
  color: #94a3b8;
}

.picker-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
}

.source-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2px;
  padding: 2px;
  background: #f5f7fa;
  border-radius: 8px;
}

.source-tab {
  height: 26px;
  padding: 0 6px;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover,
  &.active {
    color: #303133;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }
}

.picker-icon-grid {
  display: grid;
  max-height: 216px;
  grid-template-columns: repeat(auto-fill, 34px);
  gap: 6px;
  justify-content: start;
  overflow-y: auto;
  padding: 2px 2px 2px 0;
}

.picker-icon-option {
  display: flex;
  min-width: 0;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #475569;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.active {
    color: #303133;
    background: #f5f7fa;
    border-color: #c0c4cc;
  }
}

.option-icon {
  font-size: 17px;
}

.picker-icon-empty {
  grid-column: 1 / -1;
  display: flex;
  min-height: 128px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #94a3b8;
  font-size: 13px;

  svg {
    width: 34px;
    height: 34px;
    opacity: 0.5;
  }
}

.image-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.image-input {
  width: 100%;
  height: 34px;
  padding: 8px 32px 8px 12px;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  font-size: 13px;
  transition: all 0.3s ease;

  &:focus {
    border-color: #c0c4cc;
  }

  &::placeholder {
    color: #94a3b8;
  }
}

.image-clear-btn {
  position: absolute;
  right: 8px;
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #a8abb2;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    color: #606266;
  }

  svg {
    width: 13px;
    height: 13px;
  }
}

.image-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 8px 10px;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.selected-preview {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.selected-icon {
  display: inline-flex;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: #475569;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 7px;
  font-size: 16px;
}

.selected-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.selected-label {
  max-width: 210px;
  overflow: hidden;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-info code {
  max-width: 210px;
  overflow: hidden;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-preview-icon {
  flex-shrink: 0;
  font-size: 22px;
}
</style>
