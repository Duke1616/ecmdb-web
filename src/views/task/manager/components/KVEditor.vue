<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { Delete, Plus, Lock, Unlock } from "@element-plus/icons-vue"

/**
 * NOTE: 通用键值对/字典编辑器 (Dictionary Editor)
 * 整合了之前的 KVEditor 和 MapEditor，支持加密模式切换、多种数据结构解析与同步。
 * 遵循 Vue 3 Composition API 规范。
 */
interface KVItem {
  key: string
  value: string
  secret?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: any // Record<string, string> 或 KVItem[]
    valueType?: "map" | "array" // 绑定数据的底层结构: map -> 字典, array -> 列表对象
    titleKey?: string
    titleValue?: string
    addText?: string
    emptyText?: string
    showSecret?: boolean // 是否展示加密/解密切换
  }>(),
  {
    modelValue: () => ({}),
    valueType: "map",
    titleKey: "变量名 (KEY)",
    titleValue: "输入值 (VALUE)",
    addText: "添加配置项...",
    emptyText: "暂未配置任何配置项",
    showSecret: false
  }
)

const emit = defineEmits<{
  (e: "update:modelValue", val: any): void
}>()

const list = ref<KVItem[]>([])

// 解析数据源到内部列表
const parseModelToList = (val: any): KVItem[] => {
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
    const resultList: KVItem[] = []
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.entries(val).forEach(([k, v]) => {
        resultList.push({ key: k, value: String(v), secret: false })
      })
    }
    return resultList
  }
}

// 同步回父组件
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

// 监听外部数据变更 (仅在非内部操作引起的数据量变化时同步，防止输入冲突)
watch(
  () => props.modelValue,
  (val) => {
    const currentLen = list.value.filter((i) => i.key.trim()).length
    if (props.valueType === "array") {
      const incomingLen = Array.isArray(val) ? val.length : 0
      if (incomingLen !== currentLen) {
        list.value = parseModelToList(val)
      }
    } else {
      const incomingLen = Object.keys(val || {}).length
      if (incomingLen !== currentLen) {
        list.value = parseModelToList(val)
      }
    }
  },
  { deep: true }
)

const addItem = () => {
  list.value.push({ key: "", value: "", secret: false })
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
  <div class="kv-editor-unified">
    <!-- Header 标注 -->
    <div v-if="list.length > 0" class="map-header">
      <div class="label-key">{{ titleKey }}</div>
      <div class="label-value">{{ titleValue }}</div>
    </div>

    <!-- 列表展现 -->
    <div class="map-list" v-if="list.length > 0">
      <div v-for="(item, index) in list" :key="index" class="map-item-row">
        <div class="item-main">
          <!-- Key 键名 -->
          <el-input v-model="item.key" placeholder="Key" class="minimal-input key-field" @blur="syncToParent" />

          <div class="item-divider">:</div>

          <!-- Value 键值 -->
          <el-input
            v-model="item.value"
            :type="item.secret ? 'password' : 'text'"
            placeholder="Value"
            class="minimal-input value-field"
            @blur="syncToParent"
          >
            <!-- 给加密模式提供切换入口 -->
            <template #suffix v-if="showSecret">
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

    <!-- 交互区域 -->
    <div class="map-footer">
      <div class="add-trigger" @click="addItem">
        <el-icon><Plus /></el-icon>
        <span>{{ addText }}</span>
      </div>

      <!-- 空状态 -->
      <transition name="fade">
        <div v-if="list.length === 0" class="empty-status">{{ emptyText }}</div>
      </transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kv-editor-unified {
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
