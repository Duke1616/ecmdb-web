<template>
  <FormDialog
    v-model="visible"
    title="工作流示范模板库"
    :subtitle="`预设符合流程引擎规范的标准拓扑模板（当前引擎：${engineLabel}），支持一键载入画布并智能排版`"
    width="960px"
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
      <!-- 顶部引擎与分类快速筛选 -->
      <div class="filter-header">
        <el-radio-group v-model="filterType" size="default" class="filter-group">
          <el-radio-button value="recommended">
            ✨ 当前引擎推荐 ({{ recommendedCount }})
          </el-radio-button>
          <el-radio-button value="all">
            全部模板 ({{ WORKFLOW_TEMPLATES.length }})
          </el-radio-button>
          <el-radio-button value="flowx">
            FlowX 专区 (BPMN)
          </el-radio-button>
          <el-radio-button value="easyflow">
            EasyFlow 专区
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 模板卡片网格 -->
      <div class="template-grid">
        <div
          v-for="tpl in filteredTemplates"
          :key="tpl.id"
          class="template-card"
          :class="{
            'is-selected': selectedTemplateId === tpl.id,
            'is-recommended': isRecommended(tpl),
            [`theme-${tpl.badgeColor || 'blue'}`]: true
          }"
          @click="selectedTemplateId = tpl.id"
          @dblclick="handleDirectApply(tpl)"
        >
          <!-- 选中状态右上角角标 -->
          <div v-if="selectedTemplateId === tpl.id" class="selected-corner-badge">
            <el-icon><Check /></el-icon>
          </div>

          <div class="card-top">
            <div class="card-badges">
              <span class="tpl-tag" :class="`tag-${tpl.badgeColor || 'blue'}`">
                {{ tpl.tag }}
              </span>
              <span v-if="isRecommended(tpl)" class="rec-tag">
                🔥 引擎推荐
              </span>
            </div>
            <div class="node-count-badge">
              <span class="count-number">{{ tpl.nodeCount }}</span> 个节点
            </div>
          </div>

          <h4 class="card-name">{{ tpl.name }}</h4>
          <p class="card-desc">{{ tpl.description }}</p>

          <div class="steps-flow">
            <div class="steps-label">拓扑脉络：</div>
            <div class="steps-chain">
              <span
                v-for="(step, sIdx) in tpl.summary"
                :key="sIdx"
                class="step-badge"
              >
                {{ step }}
                <el-icon v-if="sIdx < tpl.summary.length - 1" class="step-arrow"><ArrowRight /></el-icon>
              </span>
            </div>
          </div>

          <div class="card-action-bar">
            <span class="select-indicator">
              <span v-if="selectedTemplateId === tpl.id" class="text-active">已选中</span>
              <span v-else class="text-inactive">点击选中 · 双击直接注入</span>
            </span>
            <el-button
              size="small"
              :type="selectedTemplateId === tpl.id ? 'primary' : 'default'"
              class="quick-apply-btn"
              @click.stop="handleDirectApply(tpl)"
            >
              一键注入
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Collection, ArrowRight, Check } from "@element-plus/icons-vue"
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

const filterType = ref<"recommended" | "all" | "flowx" | "easyflow">("recommended")
const selectedTemplateId = ref<string>("")

const isFlowX = computed(() => props.currentEngineType === "flowx")
const engineLabel = computed(() => (isFlowX.value ? "FlowX (BPMN 2.0)" : "EasyFlow"))

const isRecommended = (tpl: WorkflowTemplateItem) => {
  if (isFlowX.value && tpl.engineType === "flowx") return true
  if (!isFlowX.value && tpl.engineType === "easyflow") return true
  return false
}

const recommendedCount = computed(() => {
  return WORKFLOW_TEMPLATES.filter((tpl) => isRecommended(tpl) || tpl.engineType === "all").length
})

const filteredTemplates = computed(() => {
  if (filterType.value === "recommended") {
    return [...WORKFLOW_TEMPLATES]
      .sort((a, b) => {
        const aRec = isRecommended(a) ? 1 : 0
        const bRec = isRecommended(b) ? 1 : 0
        return bRec - aRec
      })
      .filter((tpl) => isRecommended(tpl) || tpl.engineType === "all")
  }

  if (filterType.value === "flowx") {
    return WORKFLOW_TEMPLATES.filter((tpl) => tpl.engineType === "flowx" || tpl.engineType === "all")
  }

  if (filterType.value === "easyflow") {
    return WORKFLOW_TEMPLATES.filter((tpl) => tpl.engineType === "easyflow" || tpl.engineType === "all")
  }

  return WORKFLOW_TEMPLATES
})

const selectedTemplate = computed(() => {
  return WORKFLOW_TEMPLATES.find((t) => t.id === selectedTemplateId.value)
})

const currentFooterInfo = computed(() => {
  if (selectedTemplate.value) {
    return `当前选中：「${selectedTemplate.value.name}」（共 ${selectedTemplate.value.nodeCount} 个节点）`
  }
  return "请选择要注入的示范模板"
})

// 弹窗打开时，默认选定当前引擎的最佳推荐模板
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      filterType.value = "recommended"
      const defaultTpl = WORKFLOW_TEMPLATES.find((t) => isRecommended(t)) || WORKFLOW_TEMPLATES[0]
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
  padding: 4px 6px 12px;
}

.filter-header {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;

  :deep(.el-radio-button__inner) {
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 500;
  }
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 16px;
}

.template-card {
  position: relative;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  }

  &.is-selected {
    border-color: #2563eb;
    background: #f8faff;
    box-shadow: 0 0 0 1.5px #2563eb, 0 10px 25px -5px rgba(37, 99, 235, 0.12);
  }

  &.is-recommended:not(.is-selected) {
    border-color: #cbd5e1;
    background: linear-gradient(180deg, #fcfaff 0%, #ffffff 45%);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #8b5cf6, #3b82f6);
    }
  }

  .selected-corner-badge {
    position: absolute;
    top: 0;
    right: 0;
    width: 28px;
    height: 28px;
    background: #2563eb;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom-left-radius: 10px;
    font-size: 13px;
    box-shadow: -1px 1px 4px rgba(37, 99, 235, 0.3);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-right: 18px;

    .card-badges {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tpl-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;

      &.tag-purple {
        background: #f3e8ff;
        color: #7e22ce;
        border: 1px solid #e9d5ff;
      }
      &.tag-blue {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #dbeafe;
      }
      &.tag-green {
        background: #f0fdf4;
        color: #15803d;
        border: 1px solid #dcfce7;
      }
      &.tag-slate {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }
    }

    .rec-tag {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fee2e2;
    }

    .node-count-badge {
      font-size: 12px;
      color: #64748b;

      .count-number {
        font-weight: 700;
        color: #0f172a;
      }
    }
  }

  .card-name {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px 0;
    line-height: 1.4;
  }

  .card-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 12px 0;
    flex: 1;
  }

  .steps-flow {
    background: #f8fafc;
    border-radius: 8px;
    padding: 9px 12px;
    margin-bottom: 12px;
    border: 1px solid #edf2f7;

    .steps-label {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .steps-chain {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }

    .step-badge {
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      color: #334155;
      background: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;

      .step-arrow {
        margin-left: 4px;
        font-size: 10px;
        color: #94a3b8;
      }
    }
  }

  .card-action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px dashed #e2e8f0;

    .select-indicator {
      font-size: 11px;

      .text-active {
        color: #2563eb;
        font-weight: 600;
      }

      .text-inactive {
        color: #94a3b8;
      }
    }

    .quick-apply-btn {
      font-weight: 500;
      border-radius: 6px;
    }
  }
}
</style>
