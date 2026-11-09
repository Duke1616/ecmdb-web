<template>
  <div class="workflow-data-analysis">
    <!-- 顶部视图切换与健康诊断条 -->
    <div class="analysis-toolbar">
      <div class="tab-group">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'topology' }"
          @click="activeTab = 'topology'"
        >
          <el-icon class="tab-icon"><Share /></el-icon>
          <span>拓扑流转链路</span>
          <span class="count-badge">{{ analyzedNodes.length }}</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'elements' }"
          @click="activeTab = 'elements'"
        >
          <el-icon class="tab-icon"><List /></el-icon>
          <span>节点与连线清单</span>
          <span class="count-badge">{{ analyzedNodes.length + edgesList.length }}</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'raw' }"
          @click="activeTab = 'raw'"
        >
          <el-icon class="tab-icon"><Document /></el-icon>
          <span>原始 JSON 结构</span>
        </button>
      </div>

      <!-- 诊断与快捷操作 -->
      <div class="toolbar-actions">
        <div v-if="healthStatus.isHealthy" class="health-badge is-healthy">
          <el-icon><CircleCheckFilled /></el-icon>
          <span>拓扑连贯无孤立</span>
        </div>
        <div v-else class="health-badge is-warning">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ healthStatus.warningText }}</span>
        </div>

        <el-button-group class="action-btn-group">
          <el-tooltip content="一键复制全部 JSON 数据" placement="top" :show-after="200">
            <el-button size="small" :icon="DocumentCopy" @click="handleCopyAllJson">
              复制 JSON
            </el-button>
          </el-tooltip>
          <el-tooltip content="导出为 .json 文件" placement="top" :show-after="200">
            <el-button size="small" :icon="Download" @click="handleExportJson">
              导出
            </el-button>
          </el-tooltip>
        </el-button-group>
      </div>
    </div>

    <!-- 主分析视窗 -->
    <div class="analysis-viewport">
      <!-- 视图 1：拓扑流转链路分析（高优分析视图） -->
      <div v-if="activeTab === 'topology'" class="topology-view">
        <div class="flow-summary-banner">
          <div class="banner-stat">
            <span class="label">起点节点</span>
            <span class="value">{{ startNodeName || "未配置" }}</span>
          </div>
          <div class="banner-arrow">→</div>
          <div class="banner-stat">
            <span class="label">分支流转</span>
            <span class="value">{{ gatewayCount }} 个网关 / {{ branchCount }} 条分支</span>
          </div>
          <div class="banner-arrow">→</div>
          <div class="banner-stat">
            <span class="label">终点节点</span>
            <span class="value">{{ endNodeName || "未配置" }}</span>
          </div>
        </div>

        <!-- 节点链路卡片列表 -->
        <div class="topology-cards">
          <div
            v-for="(node, index) in analyzedNodes"
            :key="node.id"
            class="topology-card"
            :class="[
              `type-${node.type}`,
              {
                'has-warning': node.isIsolated || node.isMissingNext || node.isMissingPrev
              }
            ]"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="header-left">
                <span class="node-seq">#{{ index + 1 }}</span>
                <span class="type-badge" :class="`badge-${node.type}`">
                  {{ getNodeTypeLabel(node.type) }}
                </span>
                <h4 class="node-title">{{ node.name }}</h4>
                <el-tooltip :content="`完整 ID: ${node.id}（点击复制）`" placement="top" :show-after="200">
                  <span class="node-id-chip" @click="copyText(node.id, '节点 ID')">
                    <code>{{ node.id.slice(0, 8) }}...</code>
                    <el-icon class="copy-icon"><CopyDocument /></el-icon>
                  </span>
                </el-tooltip>
              </div>

              <div class="header-right">
                <span class="coord-tag">坐标: ({{ Math.round(node.x) }}, {{ Math.round(node.y) }})</span>
                <span v-if="node.isIsolated" class="alert-pill alert-danger">孤立节点</span>
                <span v-else-if="node.isMissingPrev && node.type !== 'start'" class="alert-pill alert-warning">无前驱来源</span>
                <span v-else-if="node.isMissingNext && node.type !== 'end'" class="alert-pill alert-warning">无后继出口</span>
              </div>
            </div>

            <!-- 关系分析脉络区：前驱输入 与 后继输出 -->
            <div class="card-relations">
              <!-- 前驱输入 -->
              <div class="relation-column input-column">
                <div class="col-header">
                  <span class="col-title">
                    <el-icon class="col-icon"><Back /></el-icon> 前驱来源 ({{ node.inputs.length }})
                  </span>
                </div>
                <div class="col-body">
                  <div v-if="node.type === 'start'" class="special-status-card is-start">
                    🏁 流程起始触发源，无前置依赖
                  </div>
                  <div v-else-if="node.inputs.length === 0" class="special-status-card is-empty-warning">
                    ⚠️ 暂无任何上游节点连入此节点
                  </div>
                  <div v-else class="relation-items">
                    <div v-for="inItem in node.inputs" :key="inItem.edgeId" class="relation-item-card">
                      <div class="item-main">
                        <span class="source-tag" :class="`badge-${inItem.sourceType}`">
                          {{ getNodeTypeLabel(inItem.sourceType) }}
                        </span>
                        <span class="target-name">{{ inItem.sourceName }}</span>
                      </div>
                      <div v-if="inItem.label || inItem.expression" class="item-branch-info">
                        <span v-if="inItem.label" class="branch-label">{{ inItem.label }}</span>
                        <code v-if="inItem.expression" class="branch-code">{{ inItem.expression }}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 中间连接箭头 -->
              <div class="relation-divider">
                <el-icon><Right /></el-icon>
              </div>

              <!-- 后继输出 -->
              <div class="relation-column output-column">
                <div class="col-header">
                  <span class="col-title">
                    <el-icon class="col-icon"><Right /></el-icon> 后继流向与分支条件 ({{ node.outputs.length }})
                  </span>
                </div>
                <div class="col-body">
                  <div v-if="node.type === 'end'" class="special-status-card is-end">
                    🎯 流程终结归档节点，无后续流向
                  </div>
                  <div v-else-if="node.outputs.length === 0" class="special-status-card is-empty-warning">
                    ⚠️ 暂无后续连线出口，流转在此中断
                  </div>
                  <div v-else class="relation-items">
                    <div
                      v-for="outItem in node.outputs"
                      :key="outItem.edgeId"
                      class="relation-item-card is-output"
                    >
                      <div class="item-main">
                        <span class="target-name">→ {{ outItem.targetName }}</span>
                        <span class="source-tag" :class="`badge-${outItem.targetType}`">
                          {{ getNodeTypeLabel(outItem.targetType) }}
                        </span>
                      </div>
                      <div v-if="outItem.label || outItem.expression" class="item-branch-info">
                        <span v-if="outItem.label" class="branch-label">{{ outItem.label }}</span>
                        <span
                          v-if="outItem.expression"
                          class="expression-chip"
                          @click="copyText(outItem.expression, '条件表达式')"
                        >
                          <span class="chip-label">条件:</span>
                          <code>{{ outItem.expression }}</code>
                          <el-icon class="copy-mini"><CopyDocument /></el-icon>
                        </span>
                      </div>
                      <div v-else class="item-branch-info is-default">
                        <span class="default-flow-label">无条件默认流转</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 自定义业务属性面板（若存在） -->
            <div v-if="hasBusinessProperties(node.properties)" class="card-properties">
              <div class="prop-header">
                <span class="prop-title">节点业务属性</span>
              </div>
              <div class="prop-tags">
                <div
                  v-for="(val, key) in filterBusinessProperties(node.properties)"
                  :key="key"
                  class="prop-tag-item"
                >
                  <span class="k">{{ key }}:</span>
                  <span class="v">{{ formatPropValue(val) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 视图 2：清单表格明细（Elements） -->
      <div v-else-if="activeTab === 'elements'" class="elements-view">
        <!-- 节点列表明细 -->
        <div class="table-section">
          <div class="section-title-row">
            <h4 class="table-title">节点明细清单 ({{ analyzedNodes.length }})</h4>
            <span class="table-subtitle">统计工作流中已绘制的所有节点要素及连接度</span>
          </div>
          <el-table :data="analyzedNodes" size="small" stripe border class="data-table">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column label="节点名称" min-width="160">
              <template #default="{ row }">
                <div class="cell-node-name">
                  <span class="type-dot" :class="`badge-${row.type}`" />
                  <strong>{{ row.name }}</strong>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="节点类型" width="120">
              <template #default="{ row }">
                <span class="type-badge" :class="`badge-${row.type}`">
                  {{ getNodeTypeLabel(row.type) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="节点 ID" min-width="220">
              <template #default="{ row }">
                <span class="cell-copyable" @click="copyText(row.id, '节点 ID')">
                  <code>{{ row.id }}</code>
                  <el-icon><CopyDocument /></el-icon>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="流转度数" width="130" align="center">
              <template #default="{ row }">
                <span class="degree-badge in" title="前驱连入数">入: {{ row.inputs.length }}</span>
                <span class="degree-badge out" title="后继分流数">出: {{ row.outputs.length }}</span>
              </template>
            </el-table-column>
            <el-table-column label="画布坐标" width="140" align="center">
              <template #default="{ row }">
                <span>({{ Math.round(row.x) }}, {{ Math.round(row.y) }})</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 连线列表明细 -->
        <div class="table-section">
          <div class="section-title-row">
            <h4 class="table-title">连线分支清单 ({{ edgesList.length }})</h4>
            <span class="table-subtitle">展示源节点、目标节点及挂载的流转逻辑条件</span>
          </div>
          <el-table :data="edgesList" size="small" stripe border class="data-table">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column label="源节点" min-width="160">
              <template #default="{ row }">
                <div class="node-cell-wrapper">
                  <span class="type-dot" :class="`badge-${row.sourceType}`" />
                  <span>{{ row.sourceName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="目标节点" min-width="160">
              <template #default="{ row }">
                <div class="node-cell-wrapper">
                  <span class="type-dot" :class="`badge-${row.targetType}`" />
                  <span>{{ row.targetName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="分支名称" width="130">
              <template #default="{ row }">
                <span>{{ row.name || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="条件表达式" min-width="220">
              <template #default="{ row }">
                <code v-if="row.expression" class="table-code-chip" @click="copyText(row.expression, '条件表达式')">
                  {{ row.expression }}
                </code>
                <span v-else class="text-muted">默认无条件流转</span>
              </template>
            </el-table-column>
            <el-table-column label="连线 ID" width="180">
              <template #default="{ row }">
                <span class="cell-copyable" @click="copyText(row.id, '连线 ID')">
                  <code>{{ row.id ? row.id.slice(0, 12) + '...' : '-' }}</code>
                  <el-icon><CopyDocument /></el-icon>
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 视图 3：原始 JSON 结构（Raw Data） -->
      <div v-else-if="activeTab === 'raw'" class="raw-view">
        <div class="raw-actions-bar">
          <div class="left-tips">
            <el-icon><Document /></el-icon>
            <span>符合 LogicFlow 标准的 GraphModel 序列化数据（已自动过滤内部 isDebug 临时态）</span>
          </div>
          <div class="right-buttons">
            <el-button size="small" :icon="DocumentCopy" @click="handleCopyAllJson">
              复制完整 JSON
            </el-button>
          </div>
        </div>

        <div class="json-code-box">
          <vue-json-pretty
            :path="'workflow'"
            :data="props.graph"
            :deep="3"
            :show-icon="true"
            :show-length="true"
            :show-line="true"
            :show-double-quotes="true"
            :highlight-mouseover-node="true"
            :collapsed-on-click-brackets="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { ElMessage } from "element-plus"
import {
  Share,
  List,
  Document,
  DocumentCopy,
  Download,
  CircleCheckFilled,
  WarningFilled,
  Right,
  Back,
  CopyDocument
} from "@element-plus/icons-vue"
import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"
import { getNodeTypeLabel, getNodeDisplayName, getEdgeDisplayName } from "@/pages/ticket/workflow/utils/graph"

interface GraphNode {
  id: string
  type: string
  x: number
  y: number
  text?: string | { value?: string; x?: number; y?: number }
  properties?: Record<string, any>
}

interface GraphEdge {
  id: string
  type?: string
  sourceNodeId: string
  targetNodeId: string
  text?: string | { value?: string; x?: number; y?: number }
  properties?: Record<string, any>
}

interface Props {
  graph: {
    nodes: GraphNode[]
    edges: GraphEdge[]
  }
}

const props = defineProps<Props>()

type ActiveTab = "topology" | "elements" | "raw"
const activeTab = ref<ActiveTab>("topology")

/**
 * 节点字典快速索引
 */
const nodeMap = computed(() => {
  const map = new Map<string, GraphNode>()
  props.graph?.nodes?.forEach((node) => {
    map.set(node.id, node)
  })
  return map
})

/**
 * 拓扑分析节点对象
 */
const analyzedNodes = computed(() => {
  const nodes = props.graph?.nodes || []
  const edges = props.graph?.edges || []

  return nodes.map((node) => {
    const name = getNodeDisplayName(node)

    // 输入边与源节点
    const inEdges = edges.filter((e) => e.targetNodeId === node.id)
    const inputs = inEdges.map((e) => {
      const srcNode = nodeMap.value.get(e.sourceNodeId)
      return {
        edgeId: e.id,
        sourceNodeId: e.sourceNodeId,
        sourceName: getNodeDisplayName(srcNode),
        sourceType: srcNode?.type || "unknown",
        label: getEdgeDisplayName(e),
        expression: e.properties?.expression ? String(e.properties.expression) : undefined
      }
    })

    // 输出边与目标节点
    const outEdges = edges.filter((e) => e.sourceNodeId === node.id)
    const outputs = outEdges.map((e) => {
      const tgtNode = nodeMap.value.get(e.targetNodeId)
      return {
        edgeId: e.id,
        targetNodeId: e.targetNodeId,
        targetName: getNodeDisplayName(tgtNode),
        targetType: tgtNode?.type || "unknown",
        label: getEdgeDisplayName(e),
        expression: e.properties?.expression ? String(e.properties.expression) : undefined
      }
    })

    const isIsolated = inputs.length === 0 && outputs.length === 0
    const isMissingPrev = inputs.length === 0 && node.type !== "start"
    const isMissingNext = outputs.length === 0 && node.type !== "end"

    return {
      id: node.id,
      type: node.type,
      name,
      x: node.x,
      y: node.y,
      properties: node.properties || {},
      inputs,
      outputs,
      isIsolated,
      isMissingPrev,
      isMissingNext
    }
  })
})

/**
 * 连线清单映射
 */
const edgesList = computed(() => {
  const edges = props.graph?.edges || []
  return edges.map((e) => {
    const srcNode = nodeMap.value.get(e.sourceNodeId)
    const tgtNode = nodeMap.value.get(e.targetNodeId)
    return {
      id: e.id,
      sourceNodeId: e.sourceNodeId,
      sourceName: getNodeDisplayName(srcNode),
      sourceType: srcNode?.type || "unknown",
      targetNodeId: e.targetNodeId,
      targetName: getNodeDisplayName(tgtNode),
      targetType: tgtNode?.type || "unknown",
      name: getEdgeDisplayName(e),
      expression: e.properties?.expression ? String(e.properties.expression) : ""
    }
  })
})

/**
 * 拓扑流转 Banner 数据
 */
const startNodeName = computed(() => {
  const start = analyzedNodes.value.find((n) => n.type === "start")
  return start?.name
})

const endNodeName = computed(() => {
  const end = analyzedNodes.value.find((n) => n.type === "end")
  return end?.name
})

const gatewayCount = computed(() => {
  return analyzedNodes.value.filter((n) => ["condition", "parallel", "selective", "inclusion"].includes(n.type)).length
})

const branchCount = computed(() => edgesList.value.length)

/**
 * 健康诊断评估
 */
const healthStatus = computed(() => {
  const nodes = analyzedNodes.value
  const hasIsolated = nodes.some((n) => n.isIsolated)
  const hasMissingStart = !nodes.some((n) => n.type === "start")
  const hasMissingEnd = !nodes.some((n) => n.type === "end")
  const missingExitNodes = nodes.filter((n) => n.isMissingNext && n.type !== "end")

  if (hasMissingStart) {
    return { isHealthy: false, warningText: "缺少【开始节点】作为触发入口" }
  }
  if (hasMissingEnd) {
    return { isHealthy: false, warningText: "缺少【结束节点】作为归档终点" }
  }
  if (hasIsolated) {
    return { isHealthy: false, warningText: "检测到未连线的孤立离群节点" }
  }
  if (missingExitNodes.length > 0) {
    return { isHealthy: false, warningText: `有 ${missingExitNodes.length} 个中间节点缺少流出连线` }
  }

  return { isHealthy: true, warningText: "" }
})

/**
 * 过滤属于绘图框架使用的内部属性，只呈现业务属性
 */
const filterBusinessProperties = (propsRecord?: Record<string, any>) => {
  if (!propsRecord) return {}
  const internalKeys = new Set(["width", "height", "radius", "isDebug", "x", "y", "id"])
  const result: Record<string, any> = {}
  for (const [k, v] of Object.entries(propsRecord)) {
    if (!internalKeys.has(k) && v !== "" && v !== null && v !== undefined) {
      result[k] = v
    }
  }
  return result
}

const hasBusinessProperties = (propsRecord?: Record<string, any>) => {
  return Object.keys(filterBusinessProperties(propsRecord)).length > 0
}

const formatPropValue = (val: any) => {
  if (typeof val === "boolean") return val ? "true" : "false"
  if (typeof val === "object") return JSON.stringify(val)
  return String(val)
}

/**
 * 快速复制文本
 */
const copyText = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`${label}已复制到剪贴板`)
  } catch (err) {
    ElMessage.warning("复制失败，请手动选择复制")
  }
}

/**
 * 一键复制全部 JSON
 */
const handleCopyAllJson = async () => {
  try {
    const jsonStr = JSON.stringify(props.graph, null, 2)
    await navigator.clipboard.writeText(jsonStr)
    ElMessage.success("已复制全部图数据 JSON 到剪贴板")
  } catch (err) {
    ElMessage.error("复制失败")
  }
}

/**
 * 导出 JSON 文件
 */
const handleExportJson = () => {
  const jsonStr = JSON.stringify(props.graph, null, 2)
  const blob = new Blob([jsonStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `workflow-graph-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success("已成功导出 JSON 文件")
}

defineExpose({
  copyJson: handleCopyAllJson,
  exportJson: handleExportJson
})
</script>

<style scoped lang="scss">
.workflow-data-analysis {
  display: flex;
  flex-direction: column;
  height: 620px;
  max-height: 75vh;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
}

// 顶部工具栏
.analysis-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
  flex-shrink: 0;

  .tab-group {
    display: flex;
    gap: 6px;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 8px;

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: transparent;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;

      .tab-icon {
        font-size: 14px;
      }

      .count-badge {
        font-size: 11px;
        padding: 1px 6px;
        background: #e2e8f0;
        color: #475569;
        border-radius: 10px;
        font-weight: 600;
      }

      &:hover:not(.active) {
        color: #1e293b;
        background: rgba(255, 255, 255, 0.6);
      }

      &.active {
        background: #ffffff;
        color: #2563eb;
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

        .count-badge {
          background: #dbeafe;
          color: #1d4ed8;
        }
      }
    }
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .health-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;

      &.is-healthy {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
      }

      &.is-warning {
        background: #fffbeb;
        color: #d97706;
        border: 1px solid #fde68a;
      }
    }
  }
}

// 主内容视口
.analysis-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

// 拓扑流转视图
.topology-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.flow-summary-banner {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

  .banner-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    .label {
      font-size: 11px;
      color: #94a3b8;
    }
    .value {
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
    }
  }

  .banner-arrow {
    font-size: 16px;
    color: #cbd5e1;
    font-weight: bold;
  }
}

.topology-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topology-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &.has-warning {
    border-left: 4px solid #f59e0b;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 10px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .node-seq {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 600;
      }

      .node-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
      }

      .node-id-chip {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 2px 6px;
        background: #f1f5f9;
        border-radius: 4px;
        font-size: 11px;
        color: #64748b;
        cursor: pointer;

        code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .copy-icon {
          font-size: 11px;
          opacity: 0.6;
        }

        &:hover {
          background: #e2e8f0;
          color: #1e293b;
          .copy-icon {
            opacity: 1;
          }
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;

      .coord-tag {
        font-size: 11px;
        color: #94a3b8;
        font-family: ui-monospace, SFMono-Regular, monospace;
      }

      .alert-pill {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;

        &.alert-danger {
          background: #fef2f2;
          color: #dc2626;
        }

        &.alert-warning {
          background: #fffbeb;
          color: #d97706;
        }
      }
    }
  }

  .card-relations {
    display: flex;
    align-items: stretch;
    gap: 12px;

    .relation-column {
      flex: 1;
      min-width: 0;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 6px;
      padding: 10px 12px;

      .col-header {
        margin-bottom: 8px;
        .col-title {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;

          .col-icon {
            font-size: 13px;
          }
        }
      }

      .special-status-card {
        padding: 8px 10px;
        border-radius: 4px;
        font-size: 12px;

        &.is-start {
          background: #ecfdf5;
          color: #047857;
        }
        &.is-end {
          background: #f1f5f9;
          color: #475569;
        }
        &.is-empty-warning {
          background: #fffbeb;
          color: #b45309;
        }
      }

      .relation-items {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .relation-item-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 5px;
        padding: 6px 10px;
        font-size: 12px;

        .item-main {
          display: flex;
          align-items: center;
          gap: 6px;

          .target-name {
            font-weight: 600;
            color: #1e293b;
          }
        }

        .item-branch-info {
          margin-top: 4px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;

          .branch-label {
            font-size: 11px;
            padding: 1px 5px;
            background: #eff6ff;
            color: #1d4ed8;
            border-radius: 3px;
            font-weight: 500;
          }

          .branch-code {
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: 11px;
            color: #475569;
            background: #f1f5f9;
            padding: 1px 4px;
            border-radius: 3px;
          }

          .expression-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 4px;
            font-size: 11px;
            color: #15803d;
            cursor: pointer;

            .chip-label {
              font-weight: 600;
            }

            code {
              font-family: ui-monospace, SFMono-Regular, monospace;
              color: #166534;
            }

            .copy-mini {
              font-size: 10px;
              opacity: 0.7;
            }

            &:hover {
              background: #dcfce7;
            }
          }

          &.is-default {
            .default-flow-label {
              font-size: 11px;
              color: #94a3b8;
            }
          }
        }
      }
    }

    .relation-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #cbd5e1;
      font-size: 16px;
    }
  }

  .card-properties {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed #f1f5f9;

    .prop-header {
      margin-bottom: 6px;
      .prop-title {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
      }
    }

    .prop-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .prop-tag-item {
        font-size: 11.5px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 2px 6px;
        color: #475569;

        .k {
          color: #64748b;
          font-weight: 500;
          margin-right: 3px;
        }

        .v {
          color: #0f172a;
          font-family: ui-monospace, SFMono-Regular, monospace;
        }
      }
    }
  }
}

// 类型徽章统一样式
.type-badge {
  font-size: 11px;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 4px;
  font-weight: 600;

  &.badge-start {
    background: #ecfdf5;
    color: #059669;
  }
  &.badge-end {
    background: #f1f5f9;
    color: #475569;
  }
  &.badge-condition {
    background: #fff7ed;
    color: #c2410c;
  }
  &.badge-parallel {
    background: #eff6ff;
    color: #1d4ed8;
  }
  &.badge-selective {
    background: #faf5ff;
    color: #7e22ce;
  }
  &.badge-inclusion {
    background: #f0fdf4;
    color: #15803d;
  }
  &.badge-user {
    background: #f0fdf4;
    color: #15803d;
  }
  &.badge-automation {
    background: #eef2ff;
    color: #4338ca;
  }
  &.badge-chat {
    background: #ecfeff;
    color: #0e7490;
  }
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;

  &.badge-start { background: #10b981; }
  &.badge-end { background: #64748b; }
  &.badge-condition { background: #f97316; }
  &.badge-parallel { background: #3b82f6; }
  &.badge-selective { background: #a855f7; }
  &.badge-inclusion { background: #22c55e; }
  &.badge-user { background: #10b981; }
  &.badge-automation { background: #6366f1; }
  &.badge-chat { background: #06b6d4; }
}

// 清单明细表格视图
.elements-view {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .table-section {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    padding: 14px;

    .section-title-row {
      margin-bottom: 10px;
      .table-title {
        margin: 0;
        font-size: 13.5px;
        font-weight: 600;
        color: #1e293b;
      }
      .table-subtitle {
        font-size: 11px;
        color: #94a3b8;
      }
    }
  }

  .data-table {
    width: 100%;
    border-radius: 6px;
    overflow: hidden;

    .cell-node-name {
      display: flex;
      align-items: center;
      color: #0f172a;
    }

    .cell-copyable {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      color: #2563eb;

      code {
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 11px;
      }

      &:hover {
        text-decoration: underline;
      }
    }

    .degree-badge {
      display: inline-block;
      font-size: 11px;
      padding: 1px 5px;
      border-radius: 3px;
      margin: 0 2px;
      font-weight: 500;

      &.in {
        background: #eff6ff;
        color: #1d4ed8;
      }
      &.out {
        background: #f0fdf4;
        color: #15803d;
      }
    }

    .table-code-chip {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 11px;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: #e2e8f0;
      }
    }

    .text-muted {
      color: #94a3b8;
      font-size: 11px;
    }
  }
}

// 原始数据 JSON 视图
.raw-view {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .raw-actions-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;

    .left-tips {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
    }
  }

  .json-code-box {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    font-size: 12px;
    line-height: 1.5;
  }
}
</style>
