<template>
  <div class="workflow-editor">
    <!-- 简化的头部 -->
    <div class="editor-header">
      <div class="header-left">
        <h3 class="editor-title">工作流设计器</h3>
        <div class="workflow-stats" v-if="lf">
          <div class="stat-badge">
            <span class="stat-label">节点</span>
            <span class="stat-value">{{ getNodeCount() }}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-label">连线</span>
            <span class="stat-value">{{ getEdgeCount() }}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <!-- 辅助工具栏 -->
        <Control v-if="lf" :lf="lf" @getData="getData" @download="download" />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="logic-flow-view">
      <!-- 节点面板 - 左侧 -->
      <div class="node-sidebar">
        <NodePanel v-if="lf" :lf="lf" :nodeList="nodeList" />
      </div>

      <!-- 画布区域 - 右侧 -->
      <div class="canvas-container">
        <!-- 画布 -->
        <div id="LF-view" ref="container">
          <!-- 空状态提示 -->
          <div v-if="getNodeCount() === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <h4 class="empty-title">开始设计您的工作流</h4>
            <p class="empty-description">从左侧节点库拖拽节点到画布中开始创建工作流程</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <FormActions @previous="previous" @next="next" @cancel="close" />

    <!-- 属性面板 -->
    <el-dialog v-model="dataVisible">
      <DataDialog :graph="graph" />
    </el-dialog>

    <PropertyDialog
      v-if="showAttribute"
      :nodeData="nodeData"
      :flowDetail="flowDetail"
      :lf="lf"
      :id="formData.id"
      @closed="showAttribute = false"
    />
  </div>
  <!-- 数据查看面板 -->
</template>

<script setup lang="ts">
import { reactive, ref, nextTick, onMounted, watch } from "vue"
import LogicFlow from "@logicflow/core"
import { Menu, Snapshot, MiniMap } from "@logicflow/extension"
import "@logicflow/core/dist/index.css"
import "@logicflow/extension/lib/style/index.css"
import NodePanel from "@@/components/workflow/LFComponents/NodePanel.vue"
import Control from "@@/components/workflow/LFComponents/Control.vue"
import DataDialog from "@@/components/workflow/LFComponents/DataDialog.vue"
import PropertyDialog from "@@/components/workflow/PropertySetting/PropertyDialog.vue"
import { nodeList } from "@@/components/workflow/config"
import {
  registerStart,
  registerEnd,
  registerCondition,
  registerParallel,
  regsiterInclusion,
  registerAutomation,
  registerUser,
  registerPolyline
} from "@@/components/workflow/RegisterNode/index"
import { createOrUpdateWorkflowReq } from "@/api/workflow/types/workflow"
import FormActions from "./components/FormActions/index.vue"
import { useFormHandler } from "./composables/useFormHandler"

interface Props {
  formData: createOrUpdateWorkflowReq
}
const props = defineProps<Props>()
const emits = defineEmits(["previous", "next", "close", "update:formData"])

const localFormData = ref({ ...props.formData })

// 直接使用useFormHandler，然后在本地包装next和previous函数
const { close, next: baseNext, previous: basePrevious } = useFormHandler(localFormData, emits, "workflow")

// 包装next和previous函数，在调用前保存LogicFlow数据
const next = () => {
  if (lf.value) {
    localFormData.value.flow_data = lf.value.getGraphData()
  }
  baseNext()
}

const previous = () => {
  if (lf.value) {
    localFormData.value.flow_data = lf.value.getGraphData()
  }
  basePrevious()
}

const flowDetail = reactive<Object>({})
const lf = ref()
const nodeData = ref()
const showAttribute = ref(false)
const container = ref()
const config = reactive<any>({
  background: {
    backgroundColor: "#f8fafc"
  },
  grid: {
    size: 20,
    visible: true,
    type: "dot",
    color: "#e2e8f0",
    thickness: 1
  },
  keyboard: {
    enabled: true
  },
  edgeTextDraggable: true,
  hoverOutline: true,
  moveData: {},
  nodeList: nodeList,
  style: {
    rect: {
      radius: 8
    },
    circle: {
      radius: 20
    }
  },
  // 触摸板滚动优化
  wheel: {
    enabled: true,
    step: 0.5,
    wheelZoom: 0.1,
    touchpadZoom: 0.05
  },
  // 拖拽优化
  drag: {
    enabled: true,
    step: 1,
    throttle: 16
  }
})

const initLf = () => {
  const lfInstance = new LogicFlow({
    ...config,
    plugins: [Menu, MiniMap, Snapshot],
    container: container.value
  })
  lf.value = lfInstance
  // 设置主题
  setThemem()
  // 注册节点
  registerNode()

  // 加载数据、事件监听
  render()
}

const setThemem = () => {
  lf.value.setTheme({
    circle: {
      stroke: "#667eea",
      strokeWidth: 2,
      outlineColor: "#667eea",
      outlineWidth: 1,
      fill: "#ffffff"
    },
    rect: {
      outlineColor: "#667eea",
      outlineWidth: 1,
      stroke: "#667eea",
      strokeWidth: 2,
      fill: "#ffffff",
      radius: 8
    },
    polygon: {
      strokeWidth: 2,
      stroke: "#667eea",
      fill: "#ffffff",
      outlineColor: "#667eea"
    },
    // 简化边线样式，使用默认配置
    polyline: {
      stroke: "#94a3b8",
      strokeWidth: 2
    },
    nodeText: {
      color: "#1e293b",
      fontSize: 14,
      fontWeight: 500,
      background: {
        fill: "rgba(255, 255, 255, 0.9)",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        radius: 4
      }
    },
    edgeText: {
      color: "#475569",
      fontSize: 12,
      fontWeight: 500,
      background: {
        fill: "rgba(255, 255, 255, 0.95)",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        radius: 6
      }
    },
    anchor: {
      stroke: "#667eea",
      fill: "#ffffff",
      strokeWidth: 2,
      r: 4
    },
    anchorHover: {
      stroke: "#667eea",
      fill: "#667eea",
      strokeWidth: 2,
      r: 6
    },
    anchorActive: {
      stroke: "#667eea",
      fill: "#667eea",
      strokeWidth: 2,
      r: 6
    },
    outline: {
      stroke: "#667eea",
      strokeWidth: 2,
      strokeDasharray: "5,5"
    }
  })
}

const registerNode = () => {
  registerStart(lf.value)
  registerEnd(lf.value)
  registerUser(lf.value)
  registerCondition(lf.value)
  registerPolyline(lf.value)
  registerParallel(lf.value)
  regsiterInclusion(lf.value)
  registerAutomation(lf.value)
}

const render = () => {
  nextTick(() => {
    if (lf.value) {
      // 居中展示
      lf.value.translateCenter()
    }
  })

  LfEvent()
  updateCounts() // 设置初始计数
}

const LfEvent = () => {
  lf.value.on("node:click", ({ data }: any) => {
    nodeData.value = data
    if (["start", "user", "condition", "automation"].includes(data.type)) {
      showAttribute.value = true
    }
  })

  lf.value.on("edge:click", ({ data }: any) => {
    console.log(data)
    nodeData.value = data
    showAttribute.value = true
  })

  // 监听节点和连线的变化，实时更新计数
  lf.value.on("node:add", updateCounts)
  lf.value.on("node:delete", updateCounts)
  lf.value.on("edge:add", updateCounts)
  lf.value.on("edge:delete", updateCounts)
  lf.value.on("history:change", updateCounts)
}

const graph = ref<any>(null)
const dataVisible = ref<boolean>(false)
const nodeCount = ref(0)
const edgeCount = ref(0)

const getData = async () => {
  graph.value = lf.value.getGraphData()
  dataVisible.value = true
}

const updateCounts = () => {
  try {
    if (!lf.value) return
    const graphData = lf.value.getGraphData()
    nodeCount.value = graphData.nodes?.length || 0
    edgeCount.value = graphData.edges?.length || 0
  } catch (error) {
    nodeCount.value = 0
    edgeCount.value = 0
  }
}

const getNodeCount = () => {
  return nodeCount.value
}

const getEdgeCount = () => {
  return edgeCount.value
}

const getGraphData = () => {
  return lf.value.getGraphData()
}

const download = () => {
  console.log("download")
  return lf.value.getSnapshot()
}

onMounted(() => {
  initLf()
})

/** 监听消息是否变更 */
watch(
  () => props.formData,
  (val: createOrUpdateWorkflowReq) => {
    localFormData.value = { ...val }
    nextTick(() => {
      if (lf.value && val.flow_data) {
        lf.value.render(val.flow_data)
        // 居中展示
        lf.value.translateCenter()
        updateCounts() // 更新计数
      }
    })
  },
  { immediate: true }
)

defineExpose({
  getGraphData
})
</script>

<style lang="scss" scoped>
.workflow-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
  overflow: hidden;
  min-height: 500px;
}

.editor-header {
  background: white;
  border-bottom: 1px solid #f1f5f9;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  min-height: 70px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 工具栏在头部右侧的样式 */
.header-right .control {
  position: static;
  z-index: auto;
}

.editor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.workflow-stats {
  display: flex;
  gap: 16px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  }
}

.stat-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.logic-flow-view {
  flex: 1;
  position: relative;
  min-height: 0;
  display: flex;
  /* 触摸板滚动优化 */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.node-sidebar {
  width: 220px;
  background: white;
  border-right: 1px solid #f1f5f9;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  /* 触摸板滚动优化 */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  /* 触摸板滚动优化 */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

#LF-view {
  width: 100%;
  height: 100%;
  outline: none;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  background-image:
    radial-gradient(circle at 1px 1px, rgba(102, 126, 234, 0.08) 1px, transparent 0),
    linear-gradient(45deg, rgba(102, 126, 234, 0.03) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(102, 126, 234, 0.03) 25%, transparent 25%);
  background-size:
    20px 20px,
    40px 40px,
    40px 40px;
  position: relative;
  transition: all 0.3s ease;
  /* 触摸板滚动优化 */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  /* 滚动条样式优化 */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

/* Webkit 滚动条样式 */
#LF-view::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

#LF-view::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

#LF-view::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  transition: background 0.3s ease;
}

#LF-view::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #64748b;
  max-width: 400px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  filter: grayscale(0.3);
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #475569;
}

.empty-description {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  color: #94a3b8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

    .header-left {
      justify-content: center;
    }

    .workflow-stats {
      justify-content: center;
    }

    .header-right {
      justify-content: center;
    }
  }

  .node-sidebar {
    width: 180px;
  }
}

@media (max-width: 480px) {
  .editor-header {
    padding: 12px 16px;

    .header-left {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    .workflow-stats {
      gap: 12px;

      .stat-badge {
        padding: 6px 10px;

        .stat-label {
          font-size: 10px;
        }

        .stat-value {
          font-size: 14px;
        }
      }
    }
  }

  .node-sidebar {
    width: 160px;
  }

  .empty-state {
    max-width: 320px;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 16px;
      margin-bottom: 10px;
    }

    .empty-description {
      font-size: 13px;
    }
  }
}
</style>
