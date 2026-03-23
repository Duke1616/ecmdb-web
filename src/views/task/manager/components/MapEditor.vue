<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { Delete, Plus, Lock, Unlock } from "@element-plus/icons-vue"

/**
 * NOTE: 极简主义键值对编辑器 (V3 - 稳定性与设计增强版)
 * 已解决双向绑定导致的潜在渲染冲突，并优化了中文适配与视觉层级。
 */
interface MapItem {
  key: string
  value: string
  secret?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: any // Record<string, string> 或 any[]
    valueType?: "map" | "array"
  }>(),
  {
    valueType: "map"
  }
)

const emit = defineEmits<{
  (e: "update:modelValue", val: any): void
}>()

const list = ref<MapItem[]>([])

// 解析到 List
const parseModelToList = (val: any) => {
  if (props.valueType === "array") {
    if (Array.isArray(val)) {
      return val.map((item: any) => ({
        key: String(item.key || ""),
        value: typeof item.value === "string" ? item.value : String(item.value || ""),
        secret: !!item.secret
      }))
    }
    return []
  } else {
    // map 模式
    const resultList: MapItem[] = []
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.entries(val).forEach(([k, v]) => {
        resultList.push({ key: k, value: String(v), secret: false })
      })
    }
    return resultList
  }
}

// 核心同步逻辑：当列表数据实质性变化时触发
const syncToParent = () => {
  if (props.valueType === "array") {
    const result = list.value
      .filter((i) => i.key?.trim())
      .map((i) => ({
        key: i.key.trim(),
        value: i.value,
        secret: !!i.secret
      }))
    emit("update:modelValue", result)
  } else {
    // map 模式
    const result: Record<string, string> = {}
    list.value.forEach((item) => {
      const k = item.key?.trim()
      if (k) {
        result[k] = item.value || ""
      }
    })
    emit("update:modelValue", result)
  }
}

// 监听外部数据 (仅在长度不一致时同步，避免本地临时状态被冲掉)
watch(
  () => props.modelValue,
  (val) => {
    if (props.valueType === "array") {
      const incomingLength = Array.isArray(val) ? val.length : 0
      if (incomingLength !== list.value.filter((i) => i.key.trim()).length) {
        list.value = parseModelToList(val)
      }
    } else {
      const incomingKeys = Object.keys(val || {})
      if (incomingKeys.length !== list.value.filter((i) => i.key.trim()).length) {
        list.value = parseModelToList(val)
      }
    }
  },
  { deep: true }
)

const addItem = () => {
  list.value.push({ key: "", value: "", secret: false })
  // 注意：此处不主动触发 syncToParent，等用户输入后再触发，防止产生空 Key 污染
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
  <div class="map-editor-v3">
    <!-- Header: 仅在有内容时通过简洁的 Label 标注 -->
    <div v-if="list.length > 0" class="map-header">
      <div class="label-key">变量名 (KEY)</div>
      <div class="label-value">输入值 (VALUE)</div>
    </div>

    <!-- 列表区域: 使用 el-input 以保证交互稳定性 -->
    <div class="map-list" v-if="list.length > 0">
      <div v-for="(item, index) in list" :key="index" class="map-item-row">
        <div class="item-main">
          <!-- Key 输入 -->
          <el-input v-model="item.key" placeholder="变量名" class="minimal-input key-field" @blur="syncToParent" />

          <div class="item-divider">:</div>

          <!-- Value 输入 -->
          <el-input
            v-model="item.value"
            :type="item.secret ? 'password' : 'text'"
            placeholder="变量值"
            class="minimal-input value-field"
            @blur="syncToParent"
          >
            <template #suffix>
              <el-icon class="secret-toggle" :class="{ 'is-active': item.secret }" @click="item.secret = !item.secret">
                <component :is="item.secret ? Lock : Unlock" />
              </el-icon>
            </template>
          </el-input>
        </div>

        <!-- 动作按钮 -->
        <div class="item-actions">
          <el-button type="danger" link :icon="Delete" @click="removeItem(index)" class="delete-btn" />
        </div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="map-footer">
      <div class="add-trigger" @click="addItem">
        <el-icon><Plus /></el-icon>
        <span>添加环境变量...</span>
      </div>

      <!-- 空状态提示 -->
      <transition name="fade">
        <div v-if="list.length === 0" class="empty-status">暂未配置任何环境变量</div>
      </transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.map-editor-v3 {
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
  margin-bottom: 12px;
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

// 极简输入框样式
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
    font-family: ui-monospace, monospace;
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

.secret-toggle {
  cursor: pointer;
  color: #94a3b8;
  font-size: 14px;
  transition: color 0.2s;
  &:hover {
    color: #64748b;
  }
  &.is-active {
    color: #f59e0b;
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
