<script setup lang="ts">
import { computed } from "vue"
import { FullScreen, Close } from "@element-plus/icons-vue"
import CodeEditor from "@@/components/CodeEditor/index.vue"
import { CodebookSelector, RunnerSelector } from "@@/components/SearchSelector"
import type { Parameter } from "@/api/etask/executor/type"
import MapEditor from "./MapEditor.vue"

/**
 * NOTE: 该组件为 TaskParamsEditor 的子单元，负责单个参数的视察与编辑
 * 职责：处理单一参数的模式切换、全屏状态展示及具体的渲染逻辑
 */
interface Props {
  parameter: Parameter
  modelValue: string
  activeMode: string
  isFullScreen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "update:modelValue", val: string): void
  (e: "update:activeMode", val: string): void
  (e: "toggleFullScreen"): void
}>()

// 获取当前激活的绑定配置
const currentBinding = computed(() => props.parameter.bindings[props.activeMode])

// 处理值更新，确保类型统一为 string
const handleValueChange = (val: string | number) => {
  emit("update:modelValue", String(val))
}

// 为 KV 字典类型提供转换逻辑 (支持 kv-input)
const mapValue = computed({
  get: () => {
    try {
      if (!props.modelValue) return []
      return JSON.parse(props.modelValue)
    } catch (e) {
      return []
    }
  },
  set: (val) => {
    emit("update:modelValue", JSON.stringify(val))
  }
})
</script>

<template>
  <div class="inspector-field">
    <!-- 1. 属性元数据 (左侧) -->
    <div class="field-info">
      <div class="field-label" :class="{ required: parameter.required }">
        {{ parameter.desc || parameter.key }}
      </div>
      <code class="field-id">{{ parameter.key }}</code>
    </div>

    <!-- 2. 控制输入区 (右侧) -->
    <div class="field-control">
      <div class="input-integrated-box">
        <!-- 模式切换触发器 (仅在有多个选择时展示) -->
        <div v-if="Object.keys(parameter.bindings).length > 1" class="source-selector">
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
                <!-- A: 脚本库选择器 (codebook-picker) -->
                <template v-if="currentBinding.component === 'codebook-picker'">
                  <CodebookSelector
                    :model-value="Number(modelValue) || undefined"
                    @update:model-value="handleValueChange"
                    class="inspector-select w-full"
                    :placeholder="currentBinding.placeholder || '从代码库中选择代码'"
                  />
                </template>

                <!-- B: 代码编辑器 (code-editor) -->
                <template v-else-if="currentBinding.component === 'code-editor'">
                  <div class="embedded-editor-container" :class="{ 'is-fullscreen': isFullScreen }">
                    <div class="editor-toolbar">
                      <span class="toolbar-title">{{ parameter.desc }} ({{ currentBinding.label }})</span>
                      <el-button type="primary" link class="fullscreen-btn" @click="emit('toggleFullScreen')">
                        <el-icon>
                          <component :is="isFullScreen ? Close : FullScreen" />
                        </el-icon>
                        {{ isFullScreen ? "退出全屏" : "全屏编辑" }}
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
                    <MapEditor v-model="mapValue" value-type="array" />
                  </div>
                </template>

                <!-- X: 执行单元关联 (runner-picker) -->
                <template v-else-if="currentBinding.component === 'runner-picker'">
                  <div class="codebook-selector-wrapper">
                    <RunnerSelector
                      :model-value="modelValue ? Number(modelValue) : undefined"
                      @update:model-value="handleValueChange"
                      :placeholder="currentBinding.placeholder || '请选择执行单元...'"
                    />
                  </div>
                </template>

                <!-- E: 通用输入容错回退 (如: text/input/未识别类型) -->
                <template v-else>
                  <el-input
                    :model-value="modelValue"
                    @update:model-value="handleValueChange"
                    class="inspector-input"
                    :placeholder="currentBinding.placeholder || '请输入参数...'"
                  />
                </template>
              </template>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

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
}

.field-info {
  width: 140px;
  padding: 12px 14px;
  background: #fbfbfc;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;

  .field-label {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

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
  }
}

.field-control {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  display: flex;
  align-items: center;
}

.input-integrated-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
    padding: 20px;
    background: #ffffff;

    .editor-content {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .editor-toolbar {
      padding: 10px 0;
      .toolbar-title {
        display: block;
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

    .toolbar-title {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      display: none;
    }

    .fullscreen-btn {
      font-size: 11px;
    }
  }

  .editor-content {
    flex: 1;
    min-height: 0;
  }
}

.inspector-input,
.inspector-select {
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

.inspector-select :deep(.el-input__wrapper) {
  cursor: pointer;
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
