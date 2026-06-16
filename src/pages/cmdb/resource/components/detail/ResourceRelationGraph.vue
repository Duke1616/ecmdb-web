<template>
  <div class="resource-relation-graph">
    <div v-loading="loading" class="graph-stage">
      <RelationGraph ref="graphRef" :options="graphOptions" @node-expand="onNodeExpand" @node-collapse="onNodeCollapse">
        <template #node="{ node }">
          <div class="graph-node" @dblclick.stop="openNodeDetailDrawer(node)">
            <div
              class="graph-node-icon"
              :style="{ backgroundImage: node.data?.icon ? `url(${node.data.icon})` : 'none' }"
            >
              <span v-if="!node.data?.icon">{{ getNodeInitial(node) }}</span>
            </div>
            <div class="graph-node-content">
              <div class="graph-node-name" :title="node.text || ''">
                {{ node.text }}
              </div>
              <div class="graph-node-model" :title="getNodeModelName(node)">
                {{ getNodeModelName(node) }}
              </div>
            </div>
            <el-tooltip v-if="canViewResourceDetail" content="查看资源详情" placement="top">
              <button class="graph-node-link" type="button" @click.stop="openNodeDetailDrawer(node)">
                <el-icon><View /></el-icon>
              </button>
            </el-tooltip>
          </div>
        </template>
      </RelationGraph>
    </div>

    <Drawer
      v-model="detailDrawerVisible"
      class="resource-detail-drawer"
      :title="selectedDetailNode?.resourceName || '资源详情'"
      :subtitle="selectedDetailNode?.modelName || ''"
      :header-icon="View"
      size="42%"
      direction="rtl"
      :show-footer="false"
      @closed="clearNodeDetailDrawer"
    >
      <ResourceDescription
        v-if="selectedDetailNode"
        :key="`${selectedDetailNode.modelUid}-${selectedDetailNode.resourceId}`"
        :model-uid="selectedDetailNode.modelUid"
        :resource-id="selectedDetailNode.resourceId"
        plain
      />
    </Drawer>
  </div>
</template>

<script lang="ts" setup>
import { View } from "@element-plus/icons-vue"
import RelationGraph from "relation-graph-vue3"
import type { RGNode, RGOptions } from "relation-graph-vue3"
import { Drawer } from "@/common/components/Dialogs"
import ResourceDescription from "./ResourceDescription.vue"
import { useResourceRelationGraph } from "../../composables/detail/useResourceRelationGraph"

interface Props {
  modelUid: string
  resourceId: string
  resourceName: string
  activeName: string
}
const props = defineProps<Props>()

const graphOptions: RGOptions = {
  layouts: [
    {
      label: "Center",
      layoutName: "tree",
      layoutClassName: "seeks-layout-center",
      from: "left",
      max_per_width: 340,
      min_per_height: 74
    }
  ],
  defaultLineMarker: {
    markerWidth: 9,
    markerHeight: 9,
    refX: 5,
    refY: 5,
    data: "M2,2 L8,5 L2,8 L4.6,5 L2,2"
  },
  moveToCenterWhenRefresh: true,
  zoomToFitWhenRefresh: true,
  useAnimationWhenRefresh: true,
  allowShowMiniToolBar: false,
  defaultNodeShape: 1,
  defaultLineShape: 4,
  defaultNodeWidth: 168,
  defaultNodeHeight: 64,
  defaultJunctionPoint: "lr",
  defaultNodeBorderWidth: 0,
  defaultLineColor: "#7dd3fc",
  defaultLineWidth: 1.4,
  defaultExpandHolderColor: "#2563eb",
  defaultNodeColor: "transparent",
  disableNodeClickEffect: true
}

const {
  canViewResourceDetail,
  detailDrawerVisible,
  graphRef,
  loading,
  selectedDetailNode,
  clearNodeDetailDrawer,
  onNodeCollapse,
  onNodeExpand,
  openNodeDetailDrawer
} = useResourceRelationGraph(props)

const getNodeModelName = (node: RGNode) => {
  return node.data?.model_name || node.data?.model_uid || "未知模型"
}

const getNodeInitial = (node: RGNode) => {
  return String(getNodeModelName(node)).charAt(0).toUpperCase()
}
</script>

<style scoped>
.resource-relation-graph {
  width: 100%;
  height: 100%;
}

.graph-stage {
  width: 100%;
  height: calc(100vh - 200px);
  overflow: hidden;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  background:
    linear-gradient(#f8fafc 1px, transparent 1px), linear-gradient(90deg, #f8fafc 1px, transparent 1px), #ffffff;
  background-size: 24px 24px;
}

.graph-node {
  position: relative;
  width: 168px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px;
  box-sizing: border-box;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    border-color: #93c5fd;
    box-shadow: 0 12px 26px rgba(37, 99, 235, 0.11);
    transform: translateY(-1px);
  }
}

.graph-node-link {
  position: absolute;
  right: 6px;
  top: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-2px);
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    opacity 0.18s ease,
    transform 0.18s ease;

  &:hover {
    color: #2563eb;
    background: #eff6ff;
    border-color: #93c5fd;
  }
}

.graph-node:hover .graph-node-link {
  opacity: 1;
  transform: translateY(0);
}

.graph-node-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background-color: #f8fafc;
  background-position: center;
  background-size: cover;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

.graph-node-content {
  flex: 1;
  min-width: 0;
}

.graph-node-model {
  margin-top: 3px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.graph-node-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.rel-map) {
  background: transparent !important;
}

:deep(.rel-node-checked) {
  box-shadow: none !important;
}

:deep(.rel-node-peel) {
  padding: 0;
}

:deep(.c-rg-line) {
  stroke-width: 1.4px;
}

:deep(.c-btn-open-close) {
  width: 18px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

:deep(.c-btn-open-close span) {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  border: 1px solid #bfdbfe;
  border-radius: 50%;
  background: #ffffff !important;
  background-image: none !important;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.12);
  color: #2563eb;
  font-size: 0;
  line-height: 16px;
  pointer-events: all;
}

:deep(.c-btn-open-close span::before) {
  display: block;
  width: 100%;
  height: 100%;
  color: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
}

:deep(.c-expanded::before) {
  content: "-";
}

:deep(.c-collapsed::before) {
  content: "+";
}

:deep(.c-expand-positon-left) {
  margin-top: 0;
  margin-left: -25px;
}

:deep(.c-expand-positon-right) {
  width: 22px;
  height: 22px;
  margin-top: 0;
  margin-right: -10px;
  margin-left: -10px;
  flex: 0 0 22px;
  justify-content: center;
}

:deep(.c-expand-positon-right span) {
  margin: 0;
}

:deep(.resource-detail-drawer .drawer-content) {
  box-sizing: border-box;
  padding: 20px 24px 24px;
}

:deep(.resource-detail-drawer .resource-desc-container) {
  border: 0;
}
</style>
