<template>
  <div class="inspector-field" :class="{ 'control-only': controlOnly }">
    <!-- 1. 属性元数据 (左侧) -->
    <div v-if="!controlOnly" class="field-info" :class="{ 'has-selection': selectable }">
      <div v-if="selectable" class="parameter-actions">
        <el-tooltip v-if="selected" content="配置启动输入约束" placement="top">
          <el-button link class="parameter-settings" aria-label="配置启动输入约束" @click="emit('configure')">
            <el-icon><Setting /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip :content="selectionLabel" placement="top">
          <el-checkbox
            class="parameter-selection"
            :model-value="selected"
            :aria-label="selectionLabel"
            @change="(value) => emit('update:selected', !!value)"
          />
        </el-tooltip>
      </div>
      <div class="field-label" :class="{ required: parameter.required }">
        {{ parameter.desc || parameter.key }}
      </div>
      <code class="field-id">{{ parameter.key }}</code>
    </div>

    <!-- 2. 控制输入区 (右侧) -->
    <div class="field-control" :class="{ 'is-disabled': inputDisabled }">
      <div class="input-integrated-box">
        <!-- 模式切换触发器 (仅在有多个选择时展示) -->
        <div v-if="!controlOnly && Object.keys(parameter.bindings).length > 1" class="source-selector">
          <div
            v-for="(opt, mode) in parameter.bindings"
            :key="mode"
            class="source-option"
            :class="{ 'is-active': activeMode === mode }"
            @click="emit('update:activeMode', String(mode))"
          >
            {{ opt.label || mode }}
          </div>
        </div>

        <!-- 输入内容区: 根据 Component 动态切换 -->
        <div class="input-slot">
          <transition name="morph-fade" mode="out-in">
            <div :key="activeMode" class="w-full">
              <template v-if="currentBinding">
                <!-- A: 代码编辑器 (code-editor) -->
                <template v-if="currentBinding.component === 'code-editor'">
                  <div class="embedded-editor-container" :class="{ 'is-fullscreen': isFullScreen }">
                    <div class="editor-toolbar">
                      <div class="toolbar-left">
                        <span class="toolbar-title">{{ parameter.desc }} ({{ currentBinding.label }})</span>
                        <code class="toolbar-id">{{ parameter.key }}</code>
                      </div>
                      <el-button
                        type="primary"
                        class="fullscreen-btn"
                        :class="{ 'is-active-fs': isFullScreen }"
                        link
                        @click="emit('toggleFullScreen')"
                      >
                        <el-icon class="btn-icon">
                          <component :is="isFullScreen ? Close : FullScreen" />
                        </el-icon>
                        {{ isFullScreen ? "结束并返回" : "全屏编辑" }}
                      </el-button>
                    </div>
                    <div class="editor-content">
                      <CodeEditor
                        :code="modelValue || (currentBinding.config?.language === 'json' ? '{\n  \n}' : '')"
                        :language="currentBinding.config?.language || 'shell'"
                        @update:code="handleValueChange"
                      />
                    </div>
                  </div>
                </template>

                <!-- C: 键值对编辑器 (kv-input) -->
                <template v-else-if="currentBinding.component === 'kv-input'">
                  <div class="map-editor-wrapper">
                    <KVEditor
                      v-if="parameter.role === 'variables' && structuredVariables"
                      v-model="variableValue"
                      value-type="array"
                      show-secret
                    />
                    <KVEditor v-else v-model="mapValue" value-type="array" show-secret />
                  </div>
                </template>

                <!-- X: 执行单元关联 (runner-picker) -->
                <template v-else-if="currentBinding.component === 'runner-picker'">
                  <RunnerSelector
                    :model-value="modelValue ? Number(modelValue) : undefined"
                    @update:model-value="handleValueChange"
                    :placeholder="currentBinding.placeholder || '请选择执行单元...'"
                  />
                </template>

                <!-- 项目文件选择器 -->
                <template v-else-if="currentBinding.component === 'project-file-picker'">
                  <ProjectFileParamInput
                    :model-value="modelValue || ''"
                    :project-entry-codebook-id="projectEntryCodebookId"
                    @update:model-value="handleValueChange"
                  />
                </template>

                <!-- 布尔开关 -->
                <template v-else-if="currentBinding.component === 'boolean-switch'">
                  <button
                    type="button"
                    class="boolean-toggle-row"
                    :class="{ 'is-on': booleanValue }"
                    role="switch"
                    :aria-checked="booleanValue"
                    :aria-label="parameter.desc"
                    @click="booleanValue = !booleanValue"
                  >
                    <span class="toggle-status">
                      <span class="status-dot" />
                      <span>{{ booleanValue ? "已开启" : "当前关闭" }}</span>
                    </span>
                    <span class="toggle-action">
                      <span class="action-text">{{ booleanValue ? "点击关闭" : "点击开启" }}</span>
                      <span class="toggle-track"><span class="toggle-thumb" /></span>
                    </span>
                  </button>
                </template>

                <!-- 数值输入 -->
                <template v-else-if="currentBinding.component === 'number-input'">
                  <el-input-number
                    v-model="numberValue"
                    :min="numberRange.min"
                    :max="numberRange.max"
                    controls-position="right"
                    class="inspector-input"
                  />
                </template>

                <!-- 单选下拉 -->
                <template v-else-if="currentBinding.component === 'select-input'">
                  <el-select v-model="selectValue" class="inspector-input">
                    <el-option
                      v-for="option in selectOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </template>

                <!-- E: 通用输入容错回退 (如: text/input/未识别类型) -->
                <template v-else>
                  <el-input
                    :model-value="modelValue"
                    @update:model-value="handleValueChange"
                    class="inspector-input"
                    :placeholder="currentBinding.placeholder || '请输入参数...'"
                  >
                    <template #prefix v-if="parameter.key.toLowerCase().includes('url')">
                      <el-icon class="mr-1"><Link /></el-icon>
                    </template>
                  </el-input>
                </template>
              </template>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { FullScreen, Close, Link, Setting } from "@element-plus/icons-vue"
import CodeEditor from "@@/components/CodeEditor/index.vue"
import { RunnerSelector } from "@@/components/SearchSelector"
import type { Parameter } from "@/api/task/resource/type"
import type { VariableItem } from "@/api/task/manager/type"
import KVEditor from "./KVEditor.vue"
import ProjectFileParamInput from "@/common/components/ProjectFileParamInput/index.vue"

/**
 * NOTE: 该组件为 TaskParamsEditor 的子单元，负责单个参数的视察与编辑
 * 职责：处理单一参数的模式切换、全屏状态展示及具体的渲染逻辑
 */
interface Props {
  parameter: Parameter
  modelValue: string
  activeMode: string
  isFullScreen: boolean
  projectEntryCodebookId?: number
  selectable?: boolean
  selected?: boolean
  selectionLabel?: string
  inputDisabled?: boolean
  controlOnly?: boolean
  /** 变量语义参数使用独立数组绑定，避免通过普通参数 JSON 间接传递。 */
  structuredVariables?: VariableItem[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "update:modelValue", val: string): void
  (e: "update:structuredVariables", val: VariableItem[]): void
  (e: "update:activeMode", val: string): void
  (e: "update:selected", val: boolean): void
  (e: "configure"): void
  (e: "toggleFullScreen"): void
}>()

// 获取当前激活的绑定配置 (带容错兜底，防止元数据不完整导致崩溃)
const currentBinding = computed(() => {
  if (!props.parameter?.bindings || !props.activeMode) return null
  return props.parameter.bindings[props.activeMode] || null
})

// 处理值更新，确保类型统一为 string
const handleValueChange = (val: string | number | number[] | undefined) => {
  if (Array.isArray(val)) {
    emit("update:modelValue", val.join(","))
    return
  }
  emit("update:modelValue", val === undefined ? "" : String(val))
}

const booleanValue = computed<boolean>({
  get: () => props.modelValue === "true",
  set: (value) => emit("update:modelValue", String(value))
})

const numberValue = computed<number>({
  get: () => Number(props.modelValue) || 0,
  set: (value) => emit("update:modelValue", String(value ?? 0))
})

const numberRange = computed(() => ({
  min: Number(currentBinding.value?.config?.min) || 0,
  max: Number(currentBinding.value?.config?.max) || Number.MAX_SAFE_INTEGER
}))

interface SelectOption {
  label: string
  value: string
}

const selectOptions = computed<SelectOption[]>(() => {
  try {
    const value = JSON.parse(currentBinding.value?.config?.options || "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
})

const selectValue = computed<string>({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

// 变量参数直接读写结构化数组，避免详情回显依赖 Handler 回调把值重新序列化到 params。
const variableValue = computed<VariableItem[]>({
  get: () => props.structuredVariables ?? [],
  set: (value) => emit("update:structuredVariables", value)
})

// 缓存最近一次解析成功的合法字典值，规避 TypeScript 自引用类型推导死锁，并防范非法输入抹除数据
let lastValidValue: any[] = []

const mapValue = computed({
  get: () => {
    if (!props.modelValue) return []
    try {
      const parsed = JSON.parse(props.modelValue)
      lastValidValue = Array.isArray(parsed) ? parsed : []
      return lastValidValue
    } catch (e) {
      // 捕获临时语法异常（如手打中途）时，维持上一次成功解析的值，防止输入中途字符被强行抹除
      return lastValidValue
    }
  },
  set: (val) => {
    const rawString = JSON.stringify(val)
    if (rawString !== props.modelValue) {
      emit("update:modelValue", rawString)
    }
  }
})
</script>

<style lang="scss" scoped>
.inspector-field {
  display: flex;
  min-height: 48px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #fbfbfc;
  }

  &.control-only {
    width: 100%;
    min-height: auto;
    border: 0;
    background: transparent;

    .field-control {
      width: 100%;
      padding: 0;
    }

    .embedded-editor-container {
      height: 160px;

      .editor-toolbar {
        display: none;
      }
    }
  }
}

.field-info {
  position: relative;
  width: 104px;
  padding: 12px 8px;
  background: #fbfbfc;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;

  &.has-selection {
    padding-right: 46px;
  }

  .field-label {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
    color: #475569;
    overflow-wrap: break-word;

    &.required::after {
      content: "*";
      color: #ef4444;
      margin-left: 2px;
    }
  }

  .field-id {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 10px;
    color: #94a3b8;
    background: transparent;
    padding: 0;
    overflow-wrap: break-word;
    line-height: 1.3;
  }
}

.parameter-actions {
  position: absolute;
  top: 8px;
  right: 7px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 3px;
  height: 16px;
}

.parameter-settings {
  width: 16px;
  height: 16px;
  padding: 0;
  color: #64748b;
  font-size: 13px;
}

.parameter-selection {
  margin: 0;

  :deep(.el-checkbox__inner) {
    width: 14px;
    height: 14px;
    border-radius: 4px;
  }

  :deep(.el-checkbox__label) {
    display: none;
  }
}

.field-control {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  display: flex;
  align-items: center;

  &.is-disabled {
    pointer-events: none;
    opacity: 0.5;
  }
}

.input-integrated-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-slot,
.w-full {
  width: 100%;
  min-width: 0;
}

.inspector-input {
  width: 100%;
}

.boolean-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 42px;
  padding: 0 13px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: #b8c5d6;
    background: #fbfdff;
  }

  &.is-on {
    color: #2563eb;
    background: #f5f9ff;
    border-color: #93c5fd;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.07);
  }
}

.toggle-status,
.toggle-action {
  display: flex;
  align-items: center;
}

.toggle-status {
  gap: 8px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #cbd5e1;
  border-radius: 50%;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease;

  .is-on & {
    background: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
}

.toggle-action {
  gap: 10px;
}

.action-text {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;

  .is-on & {
    color: #60a5fa;
  }
}

.toggle-track {
  position: relative;
  width: 38px;
  height: 22px;
  background: #cbd5e1;
  border-radius: 999px;
  transition: background-color 0.18s ease;

  .is-on & {
    background: #3b82f6;
  }
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.22);
  transition: transform 0.18s ease;

  .is-on & {
    transform: translateX(16px);
  }
}

.source-selector {
  display: flex;
  gap: 8px;
  padding: 0 0 6px 0;

  .source-option {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 2px 10px;
    border-radius: 20px;
    background: #f1f5f9;
    border: 1px solid transparent;

    &:hover {
      color: #64748b;
      background: #e2e8f0;
    }

    &.is-active {
      color: #3b82f6;
      background: #eff6ff;
      border-color: #bfdbfe;
      box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
    }
  }
}

.embedded-editor-container {
  display: flex;
  flex-direction: column;
  height: 200px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    border-radius: 0;
    padding: 0;
    background: #fdfdfe;
    display: flex;
    flex-direction: column;

    .editor-toolbar {
      padding: 0 16px;
      background: #ffffff;
      border-bottom: 2px solid #f1f5f9;
      height: 52px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 12px;

        &::before {
          content: "";
          width: 4px;
          height: 20px;
          background: #3b82f6;
          border-radius: 2px;
        }
      }

      .toolbar-title {
        display: block;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .toolbar-id {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 13px;
        color: #94a3b8;
        background: #f8fafc;
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid #f1f5f9;
      }

      .fullscreen-btn {
        height: 36px;
        padding: 0 16px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 8px;
        color: #475569;
        background: #f1f5f9;
        transition: all 0.2s;

        &:hover {
          background: #fee2e2;
          color: #ef4444;
          transform: translateY(-1px);
        }

        .btn-icon {
          font-size: 14px;
        }
      }
    }

    .editor-content {
      flex: 1;
      padding: 12px 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      overflow: hidden;

      :deep(.code-mirror) {
        height: 100%;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        box-shadow:
          0 20px 25px -5px rgba(0, 0, 0, 0.1),
          0 10px 10px -5px rgba(0, 0, 0, 0.04);
        background: #ffffff;
      }
    }
  }

  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 10px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .toolbar-title {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      display: none;
    }

    .toolbar-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }

    .fullscreen-btn {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
      color: #3b82f6;
      .btn-icon {
        font-size: 13px;
      }
    }
  }

  .editor-content {
    flex: 1;
    min-height: 0;
  }
}

.inspector-input {
  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    height: 32px;
    padding: 0 10px;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      border-color: #cbd5e1;
    }
    &:focus,
    &.is-focus {
      border-color: #3b82f6;
      background: #ffffff;
    }
  }

  :deep(input) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    color: #1e293b;
  }
}

.morph-fade-enter-active,
.morph-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.morph-fade-enter-from {
  opacity: 0;
  transform: translateY(2px);
}
.morph-fade-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}

.map-editor-wrapper {
  padding: 0;
}
</style>
