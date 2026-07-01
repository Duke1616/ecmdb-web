<template>
  <div class="binding-topology">
    <div v-if="loading" v-loading="true" class="topology-loading" />

    <template v-else-if="binding">
      <div class="topology-stage-shell">
        <div
          v-if="graphData.nodes?.length"
          ref="workspaceRef"
          class="topology-workspace"
          :class="{ 'is-compact': isCompactLayout }"
        >
          <div ref="stageRef" class="topology-stage">
            <RelationGraph
              ref="graphRef"
              class="topology-graph"
              :options="graphOptions"
              :on-node-click="handleNodeClick"
            >
              <template #node="{ node }">
                <TopologyNodeCard
                  :node="node"
                  :selected="String(node.id) === selectedNodeId"
                  @node-click="handleNodeClick"
                  @command="handleNodeCommand"
                />
              </template>
            </RelationGraph>

            <div class="topology-toolbar">
              <el-tooltip content="节点详情" placement="left">
                <button
                  class="toolbar-btn"
                  type="button"
                  :class="{ 'is-active': detailPanelVisible }"
                  @click="toggleDetailPanel"
                >
                  <el-icon><Operation /></el-icon>
                </button>
              </el-tooltip>

              <el-tooltip content="适配视图" placement="left">
                <button class="toolbar-btn" type="button" @click="fitGraph">
                  <el-icon><Aim /></el-icon>
                </button>
              </el-tooltip>

              <el-tooltip content="重新布局" placement="left">
                <button class="toolbar-btn" type="button" @click="rerenderGraph">
                  <el-icon><RefreshRight /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </div>

          <transition name="topology-panel">
            <TopologyDetailPanel
              v-if="detailPanelVisible && selectedNodeData"
              :action-node-count="actionNodeCount"
              :actions-count="props.actions?.length || 0"
              :binding="binding"
              :compact="isCompactLayout"
              :field-entries="fieldEntries"
              :is-action-mode="isActionMode"
              :panel-chip="panelChip"
              :panel-title="panelTitle"
              :root-field-entries="rootFieldEntries"
              :selected-node-data="selectedNodeData"
              :selected-root-spec="selectedRootSpec"
              :selected-spec-node="selectedSpecNode"
              :spec-node-count="specNodeCount"
              @close="detailPanelVisible = false"
            />
          </transition>
        </div>

        <div v-else class="topology-empty">
          <el-empty description="当前绑定没有配置引用链路" :image-size="110" />
        </div>
      </div>
    </template>

    <div v-else class="topology-empty">
      <el-empty description="请选择绑定查看引用链路" :image-size="110" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { Aim, Operation, RefreshRight } from "@element-plus/icons-vue"
import RelationGraph from "relation-graph-vue3"
import type { RGNode, RGOptions, RelationGraphComponent } from "relation-graph-vue3"
import type { ActionSpec, PluginBindingDetail, PluginModelOption } from "@/api/cmdb/plugin/types/plugin"
import TopologyDetailPanel from "./topology/TopologyDetailPanel.vue"
import TopologyNodeCard from "./topology/TopologyNodeCard.vue"
import type { TopologyMode, TopologyNodeCommand } from "./topology/types"
import { usePluginTopologyGraph } from "./topology/usePluginTopologyGraph"

const props = defineProps<{
  binding: PluginBindingDetail | null
  loading?: boolean
  models?: PluginModelOption[]
  actions?: ActionSpec[]
  mode?: TopologyMode
}>()

const graphRef = ref<RelationGraphComponent>()
const workspaceRef = ref<HTMLDivElement>()
const stageRef = ref<HTMLDivElement>()
const selectedNodeId = ref("")
const detailPanelVisible = ref(false)
const workspaceWidth = ref(0)
let resizeObserver: ResizeObserver | null = null

const PANEL_WIDTH = 328
const WORKSPACE_GAP = 12
const STAGE_COMFORTABLE_MIN_WIDTH = 1180

const graphOptions: RGOptions = {
  layouts: [
    {
      label: "Tree",
      layoutName: "tree",
      layoutClassName: "seeks-layout-center",
      from: "left",
      max_per_width: 380,
      min_per_height: 92
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
  defaultNodeWidth: 208,
  defaultNodeHeight: 72,
  defaultJunctionPoint: "lr",
  defaultNodeBorderWidth: 0,
  defaultLineColor: "#94a3b8",
  defaultLineWidth: 1.3,
  defaultExpandHolderColor: "#2563eb",
  defaultNodeColor: "transparent",
  disableNodeClickEffect: true
}

const {
  actionNodeCount,
  fieldEntries,
  graphBundle,
  graphData,
  rootFieldEntries,
  rootNodeId,
  selectedNodeData,
  selectedRootSpec,
  selectedSpecNode,
  specNodeCount,
  resolveModelName
} = usePluginTopologyGraph({
  actions: () => props.actions,
  binding: () => props.binding,
  mode: () => props.mode,
  models: () => props.models,
  selectedNodeId
})

const isActionMode = computed(() => props.mode === "action")
const isCompactLayout = computed(
  () => workspaceWidth.value > 0 && workspaceWidth.value - PANEL_WIDTH - WORKSPACE_GAP < STAGE_COMFORTABLE_MIN_WIDTH
)

const panelTitle = computed(() => {
  if (selectedNodeData.value?.kind === "binding") {
    return props.binding?.model_name || props.binding?.model_uid || "绑定模型"
  }
  if (selectedNodeData.value?.kind === "action") {
    return selectedNodeData.value.action?.name || "执行动作"
  }
  if (selectedSpecNode.value) {
    return selectedSpecNode.value.name
  }
  return "节点详情"
})

const panelChip = computed(() => {
  if (selectedNodeData.value?.kind === "binding") return "挂载模型"
  if (selectedNodeData.value?.kind === "action") return "执行动作"
  if (selectedSpecNode.value) return resolveModelName(selectedSpecNode.value.model_uid)
  return "图谱节点"
})

const syncSelectedNode = () => {
  const rootId = graphData.value.rootId || ""
  const currentExists = graphBundle.value.nodeMap.has(selectedNodeId.value)
  if (currentExists) return
  selectedNodeId.value = graphBundle.value.preferredNodeId || rootId
}

const renderGraph = async (attempt = 0) => {
  await nextTick()
  if (!graphRef.value || !graphData.value.nodes?.length || !stageRef.value) return
  const { clientWidth, clientHeight } = stageRef.value
  if ((!clientWidth || !clientHeight) && attempt < 6) {
    requestAnimationFrame(() => {
      void renderGraph(attempt + 1)
    })
    return
  }
  await graphRef.value.setJsonData(graphData.value)
  await nextTick()
  const instance = graphRef.value.getInstance()
  await instance.moveToCenter()
  await instance.zoomToFit()
}

const fitGraph = async () => {
  await nextTick()
  const instance = graphRef.value?.getInstance()
  if (!instance) return
  await instance.moveToCenter()
  await instance.zoomToFit()
}

const rerenderGraph = async () => {
  await renderGraph()
}

const openDetailPanel = (nodeId?: string) => {
  if (nodeId) {
    selectedNodeId.value = nodeId
  } else if (!selectedNodeData.value && rootNodeId.value) {
    selectedNodeId.value = rootNodeId.value
  }
  detailPanelVisible.value = true
}

const toggleDetailPanel = () => {
  if (detailPanelVisible.value) {
    detailPanelVisible.value = false
    return
  }
  openDetailPanel()
}

const handleNodeClick = (node: RGNode) => {
  selectedNodeId.value = String(node.id)
}

const handleNodeCommand = async (command: TopologyNodeCommand, node: RGNode) => {
  if (command === "detail") {
    openDetailPanel(String(node.id))
    return
  }

  if (command === "focus-root") {
    openDetailPanel(rootNodeId.value || String(node.id))
    await fitGraph()
    return
  }

  if (command === "fit") {
    await fitGraph()
  }
}

const bindResizeObserver = () => {
  resizeObserver?.disconnect()
  resizeObserver = null

  if (typeof ResizeObserver === "undefined") return
  resizeObserver = new ResizeObserver(() => {
    workspaceWidth.value = workspaceRef.value?.clientWidth || 0
    void renderGraph()
  })
  if (workspaceRef.value) {
    workspaceWidth.value = workspaceRef.value.clientWidth
    resizeObserver.observe(workspaceRef.value)
  }
  if (stageRef.value) {
    resizeObserver.observe(stageRef.value)
  }
}

watch(
  () => props.binding,
  async () => {
    syncSelectedNode()
    await renderGraph()
  },
  { immediate: true, deep: true, flush: "post" }
)

watch(
  () => props.loading,
  async (loading) => {
    if (!loading) {
      syncSelectedNode()
      await renderGraph()
    }
  },
  { flush: "post" }
)

watch(
  () => props.mode,
  async () => {
    selectedNodeId.value = ""
    detailPanelVisible.value = false
    syncSelectedNode()
    await renderGraph()
  },
  { flush: "post" }
)

watch(
  detailPanelVisible,
  async () => {
    await renderGraph()
  },
  { flush: "post" }
)

watch(
  isCompactLayout,
  async () => {
    await renderGraph()
  },
  { flush: "post" }
)

watch([workspaceRef, stageRef], bindResizeObserver, { flush: "post" })

onMounted(async () => {
  bindResizeObserver()
  syncSelectedNode()
  await renderGraph()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped lang="scss">
.binding-topology {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: visible;
}

.topology-loading,
.topology-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  min-height: 0;
  background: #fbfcfe;
  border: 1px solid #edf2f7;
  border-radius: 8px;
}

.topology-stage-shell {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.topology-workspace {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 12px;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
}

.topology-workspace.is-compact {
  flex-direction: row;
}

.topology-stage {
  position: relative;
  flex: 1;
  min-width: 360px;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e7edf4;
  border-radius: 14px;
  background:
    linear-gradient(rgba(226, 232, 240, 0.68) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.68) 1px, transparent 1px),
    linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%);
  background-size: 24px 24px;
}

.topology-graph {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.topology-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: #475569;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;

  &:hover {
    color: #1d4ed8;
    border-color: #bfdbfe;
    background: #ffffff;
    transform: translateY(-1px);
  }

  &.is-active {
    color: #1d4ed8;
    border-color: #bfdbfe;
    background: #eff6ff;
  }
}

.topology-panel-enter-active,
.topology-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.topology-panel-enter-from,
.topology-panel-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

@media (max-width: 860px) {
  .topology-stage {
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .topology-toolbar {
    flex-direction: row;
    align-items: center;
  }

  .toolbar-btn {
    width: 34px;
    height: 34px;
  }
}
</style>
