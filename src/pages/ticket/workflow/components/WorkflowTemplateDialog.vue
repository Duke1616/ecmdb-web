<template>
  <el-dialog
    v-model="visible"
    title="工作流示范模板库"
    width="860px"
    class="workflow-template-dialog"
    destroy-on-close
    align-center
  >
    <template #header>
      <div class="dialog-header-custom">
        <div class="header-icon-box">
          <el-icon><Collection /></el-icon>
        </div>
        <div class="header-titles">
          <div class="main-title">
            工作流示范模板库
            <span class="engine-badge" :class="`engine-${currentEngineType}`">
              当前引擎: {{ engineLabel }}
            </span>
          </div>
          <div class="sub-title">
            预设符合 BPMN 2.0 与 EasyFlow 规范的标准拓扑模板，支持一键载入画布并智能排版
          </div>
        </div>
      </div>
    </template>

    <div class="template-dialog-body">
      <!-- 引擎与类别筛选工具栏 -->
      <div class="filter-bar">
        <el-radio-group v-model="filterType" size="default">
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
            'is-recommended': isRecommended(tpl),
            [`theme-${tpl.badgeColor || 'blue'}`]: true
          }"
        >
          <div class="card-top">
            <div class="card-badges">
              <span class="tpl-tag" :class="`tag-${tpl.badgeColor || 'blue'}`">
                {{ tpl.tag }}
              </span>
              <span v-if="isRecommended(tpl)" class="rec-tag">
                🔥 最佳实践
              </span>
            </div>
            <div class="node-count-badge">
              {{ tpl.nodeCount }} 节点
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

          <div class="card-footer">
            <el-button
              type="primary"
              class="apply-btn"
              @click="handleApply(tpl)"
            >
              <el-icon><Check /></el-icon>
              载入此模板
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Collection, ArrowRight, Check } from "@element-plus/icons-vue"
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
    // 置顶推荐模板，之后是通用模板
    return [...WORKFLOW_TEMPLATES].sort((a, b) => {
      const aRec = isRecommended(a) ? 1 : 0
      const bRec = isRecommended(b) ? 1 : 0
      return bRec - aRec
    }).filter((tpl) => isRecommended(tpl) || tpl.engineType === "all")
  }

  if (filterType.value === "flowx") {
    return WORKFLOW_TEMPLATES.filter((tpl) => tpl.engineType === "flowx" || tpl.engineType === "all")
  }

  if (filterType.value === "easyflow") {
    return WORKFLOW_TEMPLATES.filter((tpl) => tpl.engineType === "easyflow" || tpl.engineType === "all")
  }

  return WORKFLOW_TEMPLATES
})

const handleApply = (tpl: WorkflowTemplateItem) => {
  emits("select", tpl)
  visible.value = false
}
</script>

<style scoped lang="scss">
.workflow-template-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid #f1f5f9;
  }

  :deep(.el-dialog__body) {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
    background: #f8fafc;
  }
}

.dialog-header-custom {
  display: flex;
  align-items: center;
  gap: 12px;

  .header-icon-box {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
  }

  .header-titles {
    .main-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }

    .engine-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;

      &.engine-flowx {
        background: #f3e8ff;
        color: #7e22ce;
        border: 1px solid #e9d5ff;
      }

      &.engine-easyflow {
        background: #dbeafe;
        color: #1e40af;
        border: 1px solid #bfdbfe;
      }
    }

    .sub-title {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }
  }
}

.filter-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(370px, 1fr));
  gap: 16px;
}

.template-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    border-color: #3b82f6;
  }

  &.is-recommended {
    border-color: #6366f1;
    background: linear-gradient(180deg, #faf5ff 0%, #ffffff 40%);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #8b5cf6, #ec4899);
    }
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

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
      }
      &.tag-blue {
        background: #eff6ff;
        color: #1d4ed8;
      }
      &.tag-green {
        background: #f0fdf4;
        color: #15803d;
      }
      &.tag-slate {
        background: #f1f5f9;
        color: #475569;
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
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
    }
  }

  .card-name {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .card-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 14px 0;
    flex: 1;
  }

  .steps-flow {
    background: #f8fafc;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 14px;

    .steps-label {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 6px;
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

  .card-footer {
    display: flex;
    justify-content: flex-end;

    .apply-btn {
      width: 100%;
      border-radius: 8px;
      font-weight: 600;
    }
  }
}
</style>
