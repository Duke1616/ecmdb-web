<template>
  <div class="data-dialog-container">
    <!-- 现代化的头部 -->
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div class="header-info">
            <h3 class="header-title">工作流数据</h3>
            <p class="header-subtitle">查看当前工作流的详细结构和配置信息</p>
          </div>
        </div>

        <!-- 统计信息卡片 -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon nodes-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ nodeCount }}</span>
              <span class="stat-label">节点</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon edges-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ edgeCount }}</span>
              <span class="stat-label">连接</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 视图切换标签 -->
    <div class="view-tabs">
      <button type="button" @click="viewMode = 'tree'" :class="['tab-button', { active: viewMode === 'tree' }]">
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        树形视图
      </button>
      <button type="button" @click="viewMode = 'raw'" :class="['tab-button', { active: viewMode === 'raw' }]">
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
        原始数据
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="dialog-content">
      <!-- 树形视图 -->
      <div v-if="viewMode === 'tree'" class="tree-view">
        <!-- 节点部分 -->
        <div class="tree-section">
          <div class="section-header" @click="toggleSection('nodes')">
            <div class="section-toggle">
              <span class="toggle-icon" :class="{ expanded: expandedSections.nodes }">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
              <span class="section-title">节点配置</span>
              <span class="section-count">{{ nodeCount }}</span>
            </div>
          </div>

          <div v-if="expandedSections.nodes" class="section-content">
            <div v-for="node in props.graph.nodes" :key="node.id" class="node-card">
              <div class="node-header">
                <div class="node-type-badge" :class="`type-${node.type}`">
                  {{ getNodeTypeLabel(node.type) }}
                </div>
                <div class="node-id">{{ node.id }}</div>
              </div>

              <div class="node-details">
                <div class="detail-item">
                  <span class="detail-label">位置坐标</span>
                  <span class="detail-value">({{ node.x }}, {{ node.y }})</span>
                </div>

                <div v-if="node.text" class="detail-item">
                  <span class="detail-label">显示文本</span>
                  <span class="detail-value">{{ node.text }}</span>
                </div>

                <div v-if="node.properties && Object.keys(node.properties).length" class="detail-item">
                  <span class="detail-label">自定义属性</span>
                  <div class="properties-grid">
                    <div v-for="(value, key) in node.properties" :key="key" class="property-item">
                      <span class="property-key">{{ key }}</span>
                      <span class="property-value">{{ formatValue(value) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 连接部分 -->
        <div class="tree-section">
          <div class="section-header" @click="toggleSection('edges')">
            <div class="section-toggle">
              <span class="toggle-icon" :class="{ expanded: expandedSections.edges }">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
              <span class="section-title">连接关系</span>
              <span class="section-count">{{ edgeCount }}</span>
            </div>
          </div>

          <div v-if="expandedSections.edges" class="section-content">
            <div v-for="edge in props.graph.edges" :key="edge.id" class="edge-card">
              <div class="edge-header">
                <div class="edge-connection">
                  <span class="source-node">{{ edge.sourceNodeId }}</span>
                  <svg class="connection-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                  <span class="target-node">{{ edge.targetNodeId }}</span>
                </div>
              </div>

              <div class="edge-details">
                <div class="detail-item">
                  <span class="detail-label">连接类型</span>
                  <span class="detail-value">{{ edge.type || "默认连接" }}</span>
                </div>

                <div v-if="edge.text" class="detail-item">
                  <span class="detail-label">连接标签</span>
                  <span class="detail-value">{{ edge.text }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 原始数据视图 -->
      <div v-if="viewMode === 'raw'" class="raw-view">
        <div class="raw-header">
          <div class="raw-info">
            <svg class="raw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span>JSON 数据结构</span>
          </div>
        </div>

        <div class="json-container">
          <vue-json-pretty
            :path="'graph'"
            :data="props.graph"
            :deep="2"
            :show-icon="true"
            :show-length="true"
            :show-line="true"
            :show-double-quotes="true"
            :highlight-mouseover-node="true"
            :collapsed-on-click-brackets="true"
            :show-select-controller="false"
            :select-on-click-node="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"

interface Props {
  graph: {
    nodes: Array<{
      id: string
      type: string
      x: number
      y: number
      text?: string
      properties?: Record<string, any>
    }>
    edges: Array<{
      id: string
      type?: string
      sourceNodeId: string
      targetNodeId: string
      text?: string
    }>
  }
}

const props = defineProps<Props>()

const viewMode = ref<"tree" | "raw">("tree")
const expandedSections = ref({
  nodes: true,
  edges: true
})

const nodeCount = computed(() => props.graph.nodes?.length || 0)
const edgeCount = computed(() => props.graph.edges?.length || 0)

const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

const getNodeTypeLabel = (type: string) => {
  const typeLabels: Record<string, string> = {
    start: "开始",
    end: "结束",
    user: "用户任务",
    condition: "条件判断",
    automation: "自动化",
    parallel: "并行网关",
    inclusion: "包含网关"
  }
  return typeLabels[type] || type
}

const formatValue = (value: any) => {
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}
</script>

<style scoped>
.data-dialog-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f9fafb;
  border-radius: 12px;
  overflow: hidden;
  max-height: 70vh;
}

.dialog-header {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  gap: 16px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.header-icon svg {
  width: 24px;
  height: 24px;
  color: #3b82f6;
}

.header-info h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.025em;
}

.header-info p {
  margin: 2px 0 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.stats-cards {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
}

.stat-icon.nodes-icon {
  background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
}

.stat-icon.edges-icon {
  background: linear-gradient(135deg, #f3e8ff 0%, #ddd6fe 100%);
}

.stat-icon svg {
  width: 20px;
  height: 20px;
  color: #3b82f6;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.view-tabs {
  display: flex;
  background-color: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  padding: 6px 16px;
  gap: 6px;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  flex: 1;
  justify-content: center;
}

.tab-button:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tab-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-color: #667eea;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  transform: translateY(-1px);
}

.tab-icon {
  width: 14px;
  height: 14px;
  color: currentColor;
  flex-shrink: 0;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background-color: #f9fafb;
}

.tree-view,
.raw-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tree-section {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.section-header:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.section-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.toggle-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
  color: #64748b;
}

.toggle-icon.expanded {
  transform: rotate(90deg);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.section-count {
  font-size: 12px;
  color: #6b7280;
  margin-left: auto;
  padding: 3px 10px;
  background-color: #e5e7eb;
  border-radius: 16px;
  font-weight: 500;
}

.section-content {
  padding: 16px;
}

.node-card,
.edge-card {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.node-card:hover,
.edge-card:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.node-card:last-child,
.edge-card:last-child {
  margin-bottom: 0;
}

.node-header,
.edge-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.node-type-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.type-start {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
.type-end {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
.type-user {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}
.type-condition {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}
.type-automation {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}
.type-parallel {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}
.type-inclusion {
  background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
}

.node-id,
.source-node,
.target-node {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 13px;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.edge-connection {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  color: #1f2937;
  background-color: #f3f4f6;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.connection-arrow {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.node-details,
.edge-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  min-width: 80px;
  padding-top: 2px;
}

.detail-value {
  font-size: 14px;
  color: #6b7280;
  flex: 1;
  line-height: 1.5;
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  flex: 1;
}

.property-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #ffffff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.property-item:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.property-key {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.property-value {
  font-size: 12px;
  color: #6b7280;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.raw-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.raw-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  border-radius: 8px;
}

.raw-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #374151;
}

.raw-icon {
  width: 20px;
  height: 20px;
  color: #3b82f6;
}

.json-container {
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

/* Custom JSON Pretty styles */
:deep(.vjs-tree) {
  font-size: 14px;
}

:deep(.vjs-tree .vjs-tree__node) {
  padding: 2px 0;
}

:deep(.vjs-tree .vjs-key) {
  color: #1e40af;
  font-weight: 500;
}

:deep(.vjs-tree .vjs-value__string) {
  color: #059669;
}

:deep(.vjs-tree .vjs-value__number) {
  color: #dc2626;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-header {
    padding: 20px;
    gap: 16px;
  }

  .header-info h3 {
    font-size: 20px;
  }

  .stats-cards {
    flex-direction: column;
    gap: 12px;
  }

  .stat-card {
    padding: 14px 16px;
  }

  .view-tabs {
    flex-direction: row;
  }

  .tab-button {
    padding: 10px 16px;
    font-size: 12px;
  }

  .tab-icon {
    width: 14px;
    height: 14px;
  }

  .dialog-content {
    padding: 20px;
  }

  .section-content {
    padding: 16px;
  }

  .properties-grid {
    grid-template-columns: 1fr;
  }
}
</style>
