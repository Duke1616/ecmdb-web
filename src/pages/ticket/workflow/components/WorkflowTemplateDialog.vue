<template>
  <FormDialog
    v-model="visible"
    title="工作流示范模板库"
    :subtitle="`精选适用于【${engineLabel}】引擎的标准拓扑模板，支持一键载入画布并智能排版`"
    width="920px"
    :header-icon="Collection"
    :show-footer="true"
    :show-footer-info="true"
    :footer-info-text="currentFooterInfo"
    confirm-text="确认载入此模板"
    :confirm-disabled="!selectedTemplate"
    @confirm="handleConfirmApply"
    @cancel="visible = false"
  >
    <div class="template-dialog-content">
      <!-- 模板卡片网格 -->
      <div class="template-grid">
        <div
          v-for="tpl in currentEngineTemplates"
          :key="tpl.id"
          class="template-card"
          :class="{ 'is-selected': selectedTemplateId === tpl.id }"
          @click="selectedTemplateId = tpl.id"
          @dblclick="handleDirectApply(tpl)"
        >
          <!-- 卡片头部：左侧场景特性标签，右侧节点统计与单选指示器 -->
          <div class="card-header">
            <span class="scene-tag" :class="`scene-${tpl.badgeColor || 'slate'}`">
              {{ tpl.tag }}
            </span>
            <div class="header-right">
              <span class="node-count">{{ tpl.nodeCount }} 节点</span>
              <div class="radio-indicator">
                <span class="radio-dot" />
              </div>
            </div>
          </div>

          <!-- 卡片主标题与描述 -->
          <h4 class="card-title">{{ tpl.name }}</h4>
          <p class="card-desc">{{ tpl.description }}</p>

          <!-- 拓扑脉络步骤条 -->
          <div class="flow-track">
            <div class="track-label">拓扑脉络</div>
            <div class="track-nodes">
              <span
                v-for="(step, sIdx) in tpl.summary"
                :key="sIdx"
                class="node-pill"
              >
                {{ step }}
                <el-icon v-if="sIdx < tpl.summary.length - 1" class="pill-arrow">
                  <ArrowRight />
                </el-icon>
              </span>
            </div>
          </div>

          <!-- 卡片底部轻量操作提示 -->
          <div class="card-footer">
            <span class="status-hint">
              <span v-if="selectedTemplateId === tpl.id" class="hint-active">已选中当前模板</span>
              <span v-else class="hint-normal">点击选择 · 双击立即注入</span>
            </span>
            <button
              type="button"
              class="quick-apply-link"
              @click.stop="handleDirectApply(tpl)"
            >
              一键注入
            </button>
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Collection, ArrowRight } from "@element-plus/icons-vue"
import { FormDialog } from "@/common/components/Dialogs"
import { WORKFLOW_TEMPLATES, type WorkflowTemplateItem } from "../templates"

interface Props {
  modelValue: boolean
  currentEngineType?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  currentEngineType: "flowx"
})

const emits = defineEmits<{
  (e: "update:modelValue", val: boolean): void
  (e: "select", tpl: WorkflowTemplateItem): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emits("update:modelValue", val)
})

const selectedTemplateId = ref<string>("")

const isFlowX = computed(() => props.currentEngineType === "flowx")
const engineLabel = computed(() => (isFlowX.value ? "FlowX 流程引擎" : "EasyFlow 流程引擎"))

// 仅展示适配当前选定引擎的示范模板（当前引擎专属模板 + 通用模板）
const currentEngineTemplates = computed(() => {
  return WORKFLOW_TEMPLATES.filter((tpl) => {
    if (isFlowX.value) {
      return tpl.engineType === "flowx" || tpl.engineType === "all"
    }
    return tpl.engineType === "easyflow" || tpl.engineType === "all"
  })
})

const selectedTemplate = computed(() => {
  return currentEngineTemplates.value.find((t) => t.id === selectedTemplateId.value)
})

const currentFooterInfo = computed(() => {
  if (selectedTemplate.value) {
    return `当前选中：「${selectedTemplate.value.name}」（共 ${selectedTemplate.value.nodeCount} 个节点）`
  }
  return `当前共 ${currentEngineTemplates.value.length} 个模板，点击卡片选择后载入`
})

// 弹窗打开或引擎切换时，默认选中第一项
watch(
  () => [props.modelValue, props.currentEngineType],
  ([val]) => {
    if (val) {
      const defaultTpl = currentEngineTemplates.value[0]
      if (defaultTpl) {
        selectedTemplateId.value = defaultTpl.id
      }
    }
  },
  { immediate: true }
)

const handleDirectApply = (tpl: WorkflowTemplateItem) => {
  selectedTemplateId.value = tpl.id
  emits("select", tpl)
  visible.value = false
}

const handleConfirmApply = () => {
  if (!selectedTemplate.value) return
  emits("select", selectedTemplate.value)
  visible.value = false
}
</script>

<style scoped lang="scss">
.template-dialog-content {
  padding: 4px 4px 10px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(410px, 1fr));
  gap: 14px;
}

.template-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 15px 16px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    border-color: #94a3b8;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  }

  &.is-selected {
    border-color: #2563eb;
    background: #fafcff;
    box-shadow: 0 0 0 1px #2563eb, 0 6px 20px rgba(37, 99, 235, 0.09);

    .radio-indicator {
      border-color: #2563eb;

      .radio-dot {
        opacity: 1;
        transform: scale(1);
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .scene-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;

      &.scene-purple {
        background: #f5f3ff;
        color: #7c3aed;
        border: 1px solid #ede9fe;
      }
      &.scene-blue {
        background: #eff6ff;
        color: #2563eb;
        border: 1px solid #dbeafe;
      }
      &.scene-green {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #dcfce7;
      }
      &.scene-slate {
        background: #f8fafc;
        color: #475569;
        border: 1px solid #e2e8f0;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;

      .node-count {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .radio-indicator {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        border: 1.5px solid #cbd5e1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        .radio-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      }
    }
  }

  .card-title {
    font-size: 14.5px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px 0;
    line-height: 1.4;
  }

  .card-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.55;
    margin: 0 0 10px 0;
    flex: 1;
  }

  .flow-track {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 7px;
    padding: 8px 10px;
    margin-bottom: 10px;

    .track-label {
      font-size: 10.5px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .track-nodes {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }

    .node-pill {
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      color: #334155;
      background: #ffffff;
      padding: 1.5px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;

      .pill-arrow {
        margin-left: 4px;
        font-size: 9px;
        color: #94a3b8;
      }
    }
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6px;
    border-top: 1px dashed #f1f5f9;

    .status-hint {
      font-size: 11px;

      .hint-active {
        color: #2563eb;
        font-weight: 600;
      }

      .hint-normal {
        color: #94a3b8;
      }
    }

    .quick-apply-link {
      background: none;
      border: none;
      padding: 0;
      font-size: 11.5px;
      color: #3b82f6;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.15s;

      &:hover {
        color: #1d4ed8;
        text-decoration: underline;
      }
    }
  }
}
</style>
