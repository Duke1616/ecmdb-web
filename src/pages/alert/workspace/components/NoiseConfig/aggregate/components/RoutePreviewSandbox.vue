<template>
  <section class="preview-panel">
    <div class="preview-header">
      <div class="header-title">
        <el-icon class="sandbox-icon"><Cpu /></el-icon>
        <div>
          <h5>匹配验证沙箱</h5>
          <span>使用一条模拟告警进行匹配路由路径和分组规则调试</span>
        </div>
      </div>
    </div>

    <!-- 模拟数据配置区域 -->
    <div class="sandbox-form-card">
      <div class="card-section-title">
        <el-icon><Setting /></el-icon>
        <span>告警属性录入</span>
      </div>

      <el-row :gutter="12">
        <el-col :xs="24" :sm="8">
          <el-form-item label="告警名称 (alertname)">
            <el-input v-model="previewForm.rule_name" placeholder="请输入模拟告警名称" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="集群环境 (cluster)">
            <el-input v-model="previewForm.cluster" placeholder="如 prod-k8s, dev" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="告警级别">
            <el-select v-model="previewForm.level" style="width: 100%">
              <el-option v-for="level in levelOptions" :key="level.value" :label="level.label" :value="level.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="labels-section">
        <div class="section-subtitle">
          <span>附加标签 (labels)</span>
          <el-button text type="primary" size="small" :icon="Plus" @click="addPreviewLabel">添加标签</el-button>
        </div>

        <div class="preview-labels-grid" v-if="previewForm.labels.length > 0">
          <div v-for="(label, index) in previewForm.labels" :key="index" class="preview-label-row">
            <el-input v-model="label.key" placeholder="标签名" size="small" />
            <el-input v-model="label.value" placeholder="标签值" size="small" />
            <el-button text type="danger" size="small" @click="removePreviewLabel(index)">删除</el-button>
          </div>
        </div>
        <div v-else class="empty-labels-tip">暂无附加标签，可点击“添加标签”按钮进行配置</div>
      </div>
    </div>

    <!-- 匹配报告区域 -->
    <div v-if="previewResult" class="sandbox-report-card">
      <div class="report-header">
        <el-icon class="success-icon"><CircleCheck /></el-icon>
        <div class="report-title-desc">
          <h6>匹配分析报告</h6>
          <span>该模拟告警匹配路径及降噪参数计算结果如下</span>
        </div>
      </div>

      <div class="report-body">
        <div class="report-main-result">
          <div class="result-highlight">
            <span class="label">最终命中路由</span>
            <span class="value" :title="previewResult.route_name">{{ previewResult.route_name || "-" }}</span>
          </div>
          <div class="fingerprint-badge" @click="copyFingerprint" title="点击复制指纹">
            <el-icon><CopyDocument /></el-icon>
            <span>分组指纹：{{ previewResult.group_fingerprint }}</span>
          </div>
        </div>

        <!-- 命中路径流程 -->
        <div class="path-timeline">
          <div class="timeline-label">
            <el-icon><Share /></el-icon>
            <span>命中路由路径</span>
          </div>
          <div class="timeline-flow">
            <template v-for="(node, index) in pathBreadcrumbs" :key="index">
              <div class="timeline-node" :class="{ 'is-last': index === pathBreadcrumbs.length - 1 }">
                {{ node }}
              </div>
              <el-icon v-if="index < pathBreadcrumbs.length - 1" class="flow-arrow"><ArrowRight /></el-icon>
            </template>
          </div>
        </div>

        <!-- 分组与节奏 Grid -->
        <div class="report-grid">
          <div class="grid-cell">
            <span class="cell-label">分组策略 (group_by)</span>
            <div class="cell-content tags-list">
              <template v-if="previewResult.group_by && previewResult.group_by.length > 0">
                <el-tag v-for="tag in previewResult.group_by" :key="tag" size="small" type="success" effect="plain">
                  {{ tag }}
                </el-tag>
              </template>
              <span v-else class="empty-text">未指定（不分组）</span>
            </div>
          </div>

          <div class="grid-cell">
            <span class="cell-label">区分数据源</span>
            <div class="cell-content">
              <el-tag :type="previewResult.is_diff_data_source ? 'warning' : 'info'" size="small" effect="light">
                {{ previewResult.is_diff_data_source ? "是 (独立计算指纹)" : "否 (跨源混合指纹)" }}
              </el-tag>
            </div>
          </div>

          <div class="grid-cell double-width">
            <span class="cell-label">降噪发送控制 (等待 / 间隔 / 重复)</span>
            <div class="cell-content timing-row">
              <div class="timing-box">
                <span class="box-lbl">组等待</span>
                <span class="box-val">{{ previewResult.group_wait }}s</span>
              </div>
              <div class="timing-box">
                <span class="box-lbl">组间隔</span>
                <span class="box-val">{{ previewResult.group_interval }}s</span>
              </div>
              <div class="timing-box">
                <span class="box-lbl">重复间隔</span>
                <span class="box-val">{{ formatRepeatInterval(previewResult.repeat_interval) }}</span>
              </div>
            </div>
          </div>

          <div class="grid-cell double-width">
            <span class="cell-label">通知策略</span>
            <div class="cell-content notify-result">
              <div class="receiver-tags">
                <template v-if="previewResult.receivers && previewResult.receivers.length > 0">
                  <el-tag
                    v-for="receiver in previewResult.receivers"
                    :key="`${receiver.type}-${receiver.id}`"
                    size="small"
                    type="primary"
                    effect="plain"
                  >
                    {{ getReceiverTypeLabel(receiver.type) }} / {{ receiver.display_name || receiver.id }}
                  </el-tag>
                </template>
                <span v-else class="empty-text">继承工作空间默认团队</span>
              </div>
              <el-tag size="small" type="info" effect="plain">
                {{ previewResult.template_id ? `模板 #${previewResult.template_id}` : "继承工作空间默认模板" }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 尚未匹配的占位态 -->
    <div v-else class="sandbox-placeholder">
      <div class="placeholder-icon">
        <el-icon class="floating-cpu"><Cpu /></el-icon>
      </div>
      <h6>等待匹配测试</h6>
      <p>在上方填写模拟告警属性，点击“执行验证”后即可在此处获得命中路由深度诊断报告</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { ElMessage } from "element-plus"

const emit = defineEmits<{
  (e: "update:previewing", val: boolean): void
}>()
import { ArrowRight, CircleCheck, CopyDocument, Cpu, Plus, Setting, Share } from "@element-plus/icons-vue"
import { previewAggregateRouteApi } from "@/api/alert/aggregate"
import type { AggregateGroupRule, PreviewAggregateRouteResp } from "@/api/alert/aggregate/types"

interface PreviewLabel {
  key: string
  value: string
}

const props = defineProps<{
  workspaceId: number
  routes: AggregateGroupRule[]
}>()

const previewing = ref(false)
const previewResult = ref<PreviewAggregateRouteResp | null>(null)

const levelOptions = [
  { label: "P0-紧急", value: 1 },
  { label: "P1-严重", value: 2 },
  { label: "P2-错误", value: 3 },
  { label: "P3-警告", value: 4 },
  { label: "P4-提示", value: 5 }
]

const previewForm = reactive({
  rule_name: "模拟告警",
  data_source_id: undefined as number | undefined,
  cluster: "",
  level: 4,
  labels: [
    { key: "alert_name", value: "HighCPU" },
    { key: "service", value: "api" },
    { key: "instance", value: "10.0.0.1" }
  ] as PreviewLabel[]
})

watch(
  () => props.workspaceId,
  () => {
    previewResult.value = null
  }
)

const pathBreadcrumbs = computed(() => {
  const path = previewResult.value?.route_path
  if (!path || path.length === 0) return []
  return path.map((id) => props.routes.find((route) => route.id === id)?.name || `#${id}`)
})

function addPreviewLabel() {
  previewForm.labels.push({ key: "", value: "" })
}

function removePreviewLabel(index: number) {
  previewForm.labels.splice(index, 1)
}

async function handlePreview() {
  previewing.value = true
  emit("update:previewing", true)
  try {
    const labels = previewForm.labels.reduce<Record<string, string>>((acc, label) => {
      const key = label.key.trim()
      if (key) {
        acc[key] = label.value
      }
      return acc
    }, {})

    const { data } = await previewAggregateRouteApi({
      workspace_id: props.workspaceId,
      rule_name: previewForm.rule_name,
      data_source_id: previewForm.data_source_id,
      cluster: previewForm.cluster,
      level: previewForm.level,
      labels
    })
    previewResult.value = data
  } catch (error) {
    console.error("预览聚合路由失败:", error)
    ElMessage.error("预览聚合路由失败")
  } finally {
    previewing.value = false
    emit("update:previewing", false)
  }
}

const resetSandbox = () => {
  previewResult.value = null
}

const copyFingerprint = async () => {
  if (!previewResult.value?.group_fingerprint) return
  try {
    await navigator.clipboard.writeText(String(previewResult.value.group_fingerprint))
    ElMessage.success("分组指纹已复制")
  } catch (e) {
    ElMessage.error("复制失败")
  }
}

function formatRepeatInterval(s: number) {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (s % 60 !== 0) return `${s}s`
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (m % 60 !== 0) return `${m}m`
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (h % 24 !== 0) return `${h}h`
  return `${d}d`
}

function getReceiverTypeLabel(type: string) {
  const labels: Record<string, string> = {
    user: "用户",
    team: "团队",
    oncall: "排班"
  }
  return labels[type] || type
}

defineExpose({
  resetSandbox,
  handlePreview
})
</script>

<style lang="scss" scoped>
.preview-panel {
  background: #ffffff;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;

    .sandbox-icon {
      font-size: 20px;
      color: #3b82f6;
      background: #eff6ff;
      padding: 6px;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
    }

    h5 {
      margin: 0;
      color: #0f172a;
      font-size: 14px;
      font-weight: 700;
    }

    span {
      display: block;
      margin-top: 2px;
      color: #64748b;
      font-size: 11px;
    }
  }

  .test-btn {
    border-radius: 8px;
    font-weight: 600;
  }
}

.sandbox-form-card {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;

  .card-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 16px;
    position: relative;
    padding-left: 10px;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 14px;
      background: #3b82f6;
      border-radius: 2px;
    }

    .el-icon {
      color: #3b82f6;
      font-size: 14px;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  :deep(.el-form-item__label) {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    padding-bottom: 4px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

.labels-section {
  margin-top: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;

  .section-subtitle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    span {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }
  }
}

.preview-labels-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-label-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 48px;
  gap: 6px;
  align-items: center;

  :deep(.el-input__wrapper) {
    background: #ffffff;
  }
}

.empty-labels-tip {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  padding: 8px 0;
  font-style: italic;
}

.sandbox-report-card {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 12px 0;
  background: transparent;
  border-bottom: 1px solid #bbf7d0;
  margin-bottom: 16px;

  .success-icon {
    font-size: 20px;
    color: #16a34a;
  }

  .report-title-desc {
    h6 {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      color: #14532d;
    }
    span {
      font-size: 10px;
      color: #166534;
    }
  }
}

.report-body {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-main-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;

  .result-highlight {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 10px;
      color: #166534;
      font-weight: 500;
    }

    .value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
  }

  .fingerprint-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      border-color: #3b82f6;
      color: #2563eb;
      background: #f0f7ff;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.path-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #faf5ff;
  border: 1px solid #f3e8ff;
  border-radius: 8px;

  .timeline-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #7c3aed;
    font-weight: 600;

    .el-icon {
      font-size: 13px;
    }
  }

  .timeline-flow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
}

.timeline-node {
  font-size: 11px;
  font-weight: 600;
  color: #6b21a8;
  background: #ffffff;
  border: 1px solid #e9d5ff;
  padding: 2px 8px;
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(107, 33, 168, 0.03);

  &.is-last {
    color: #ffffff;
    background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
    border-color: #8b5cf6;
    box-shadow: 0 2px 4px rgba(124, 58, 237, 0.15);
  }
}

.flow-arrow {
  font-size: 11px;
  color: #d8b4fe;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.grid-cell {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.double-width {
    grid-column: span 2;
  }

  .cell-label {
    font-size: 10px;
    color: #64748b;
    font-weight: 500;
  }

  .cell-content {
    min-height: 24px;
    display: flex;
    align-items: center;
  }
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.empty-text {
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
}

.timing-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.timing-box {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 5px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;

  .box-lbl {
    font-size: 10px;
    color: #64748b;
  }

  .box-val {
    font-size: 11px;
    font-weight: 700;
    color: #0f172a;
    margin-left: auto;
  }
}

.notify-result {
  display: flex;
  flex-direction: column;
  align-items: flex-start !important;
  gap: 8px;
}

.receiver-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sandbox-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 42px 20px;
  text-align: center;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #ffffff;

  .placeholder-icon {
    margin-bottom: 12px;
    background: #f1f5f9;
    padding: 14px;
    border-radius: 50%;
    color: #94a3b8;

    .floating-cpu {
      font-size: 32px;
      animation: float-around 3s infinite ease-in-out;
    }
  }

  h6 {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
  }

  p {
    margin: 0;
    font-size: 11px;
    color: #64748b;
    max-width: 280px;
    line-height: 1.4;
  }
}

@keyframes float-around {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
  100% {
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
  .grid-cell.double-width {
    grid-column: span 1;
  }
  .timing-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
