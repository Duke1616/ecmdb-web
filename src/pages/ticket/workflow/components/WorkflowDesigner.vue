<template>
  <div class="workflow-editor">
    <!-- 头部工具栏 -->
    <div class="editor-header">
      <div class="header-left">
        <h3 class="editor-title">工作流设计器</h3>
        <div v-if="lf" class="workflow-stats">
          <div class="stat-badge">
            <span class="stat-label">节点</span>
            <span class="stat-value">{{ nodeCount }}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-label">连线</span>
            <span class="stat-value">{{ edgeCount }}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <Control
          v-if="lf"
          :lf="lf"
          :debug="isDebugMode"
          @getData="getData"
          @download="download"
          @toggleDebug="handleToggleDebug"
          @calibrate="handleCalibrate"
          @loadDemo="handleLoadDemo"
        />
      </div>
    </div>

    <!-- 画布主要内容区域 -->
    <div class="logic-flow-view">
      <!-- 节点面板 - 左侧 -->
      <div class="node-sidebar">
        <NodePanel v-if="lf" :lf="lf" :engine-type="formData.engine_type" />
      </div>

      <!-- 画布与就地悬浮工具 - 右侧 -->
      <div class="canvas-container">
        <div id="LF-view" ref="container" />

        <!-- 网关节点就地快速切换工具条 -->
        <GatewayQuickSwitcher
          v-if="lf"
          :lf="lf"
          :nodeData="selectedGatewayNode"
          :disabled="isWorkflowReadonly"
          :engine-type="formData.engine_type"
          @change-type="handleChangeGatewayType"
          @open-detail="handleOpenGatewayDetail"
        />
      </div>
    </div>

    <!-- 底部步骤条按钮 -->
    <FormActions @previous="previous" @next="handleNext" @cancel="close" />

    <!-- 工作流数据与拓扑分析弹窗（统一采用封装的 FormDialog） -->
    <FormDialog
      v-model="dataVisible"
      title="工作流拓扑与图数据"
      subtitle="直观分析工作流节点拓扑关系、连线分支脉络及底层 JSON 结构"
      width="1020px"
      :header-icon="DataAnalysis"
      confirm-text="复制完整 JSON"
      :show-footer="true"
      :show-footer-info="true"
      :footer-info-text="`当前包含 ${graph?.nodes?.length || 0} 个节点，${graph?.edges?.length || 0} 条分支连线`"
      :full-height="true"
      @confirm="handleCopyDataJson"
      @cancel="dataVisible = false"
    >
      <DataDialog v-if="graph" ref="dataDialogRef" :graph="graph" />
    </FormDialog>

    <!-- 节点属性抽屉 -->
    <PropertyDialog
      v-if="showAttribute && lf"
      :nodeData="nodeData"
      :flowDetail="flowDetail"
      :lf="lf"
      :id="formData.id"
      :engine-type="formData.engine_type"
      @closed="showAttribute = false"
      @change-type="handleChangeGatewayType"
    />

    <!-- 工作流示范模板库弹窗 -->
    <WorkflowTemplateDialog
      v-model="templateVisible"
      :current-engine-type="formData.engine_type"
      @select="handleSelectTemplate"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick, onMounted, onUnmounted, watch, computed } from "vue"
import { ElNotification, ElMessageBox, ElMessage } from "element-plus"
import { DataAnalysis } from "@element-plus/icons-vue"
import { v4 as uuidv4 } from "uuid"
import LogicFlow from "@logicflow/core"
import { Menu, Snapshot, MiniMap, SelectionSelect, ProximityConnect } from "@logicflow/extension"
import { Dagre } from "@logicflow/layout"
import "@logicflow/core/dist/index.css"
import "@logicflow/extension/lib/style/index.css"

import NodePanel from "@@/components/workflow/LFComponents/NodePanel.vue"
import Control from "@@/components/workflow/LFComponents/Control.vue"
import DataDialog from "@@/components/workflow/LFComponents/DataDialog.vue"
import PropertyDialog from "@@/components/workflow/PropertySetting/PropertyDialog.vue"
import GatewayQuickSwitcher from "@@/components/workflow/LFComponents/GatewayQuickSwitcher.vue"
import WorkflowTemplateDialog from "./WorkflowTemplateDialog.vue"
import { WORKFLOW_NODES, registerAllNodes } from "@@/components/workflow/RegisterNode/index"
import { isGatewayType } from "@@/components/workflow/RegisterNode/gateway/constants"
import { findCompensationNodeReferences } from "@@/components/workflow/RegisterNode/automation/compensation"
import { FormDialog } from "@/common/components/Dialogs"
import FormActions from "@/common/components/FormActions/index.vue"
import { useFormHandler } from "@/common/composables/useFormHandler"
import type { CreateOrUpdateWorkflowReq } from "@/api/ticket/workflow/types/workflow"
import { type WorkflowTemplateItem } from "../types"
import { cleanGraphData, validateWorkflowGraph } from "../utils/graph"

// 引入拆分的领域 Composables
import { applyWorkflowTheme } from "../composables/useWorkflowTheme"
import { useWorkflowLayout } from "../composables/useWorkflowLayout"
import { useGatewayManager } from "../composables/useGatewayManager"
import { provideWorkflowContext } from "../composables/useWorkflowContext"

interface Props {
  formData: CreateOrUpdateWorkflowReq
}

const props = defineProps<Props>()
const emits = defineEmits(["previous", "next", "close", "update:formData"])

const { next, previous, close, setFormData } = useFormHandler(props.formData, emits, "lf")

// 画布与数据状态
const container = ref<HTMLElement>()
const lf = ref<any>()
const nodeData = ref<any>()
const showAttribute = ref(false)
const flowDetail = reactive<Record<string, any>>({})
const isSyncingFromCanvas = ref(false)
const isDebugMode = ref(false)
const nodeCount = ref(0)
const edgeCount = ref(0)

// 数据分析弹窗状态
const graph = ref<any>()
const dataDialogRef = ref<InstanceType<typeof DataDialog>>()
const dataVisible = ref<boolean>(false)
// 示范模板库弹窗状态
const templateVisible = ref<boolean>(false)

const isWorkflowReadonly = computed(() => {
  return flowDetail.status === "2" || flowDetail.status === 2
})

/**
 * 更新节点与连线数量统计
 */
const updateCounts = () => {
  if (!lf.value) return
  const graphData = lf.value.getGraphData() as any
  nodeCount.value = Array.isArray(graphData?.nodes) ? graphData.nodes.length : 0
  edgeCount.value = Array.isArray(graphData?.edges) ? graphData.edges.length : 0
}

// 画布数据同步到向导表单
const syncFormData = () => {
  if (!lf.value) return
  const graphData = lf.value.getGraphData() as any
  if (!graphData) return

  isSyncingFromCanvas.value = true
  emits("update:formData", {
    ...props.formData,
    flow_data: cleanGraphData(graphData)
  })
  nextTick(() => {
    isSyncingFromCanvas.value = false
  })
  updateCounts()
}

// 组合网关管理 Composable
const { selectedGatewayNode, handleSelectGateway, clearSelectedGateway, changeGatewayType } = useGatewayManager(
  lf,
  syncFormData,
  isDebugMode
)

// 组合画布布局与居中 Composable
const { smartCenterAndZoom, autoLayoutAndCenter } = useWorkflowLayout(lf, container, syncFormData)

// 提供全局工作流依赖注入上下文
provideWorkflowContext({
  lf,
  engineType: computed(() => props.formData.engine_type || "flowx"),
  isReadonly: isWorkflowReadonly,
  updateNodeProperties: (nodeId, properties) => {
    lf.value?.setProperties(nodeId, properties)
    syncFormData()
  },
  updateNodeText: (nodeId, text) => {
    lf.value?.updateText(nodeId, text)
    lf.value?.setProperties(nodeId, { name: text })
    syncFormData()
  },
  syncCanvasData: syncFormData
})

/**
 * 切换网关类型包装器
 */
const handleChangeGatewayType = (targetType: string) => {
  const updated = changeGatewayType(targetType, nodeData.value)
  if (updated) {
    nodeData.value = updated
  }
}

const handleOpenGatewayDetail = () => {
  if (selectedGatewayNode.value) {
    nodeData.value = selectedGatewayNode.value
    showAttribute.value = true
  }
}

/**
 * 渲染图数据到画布
 */
const renderGraphData = (graphData?: any) => {
  if (!lf.value || !graphData?.nodes) {
    updateCounts()
    return
  }

  const currentSnapshot = JSON.stringify(cleanGraphData(lf.value.getGraphData()))
  const nextSnapshot = JSON.stringify(cleanGraphData(graphData))
  if (currentSnapshot === nextSnapshot) {
    updateCounts()
    return
  }

  lf.value.render(graphData)
  nextTick(() => {
    updateCounts()
    smartCenterAndZoom()
  })
}

/**
 * 切换调试模式
 */
const handleToggleDebug = (val: boolean) => {
  isDebugMode.value = val
  if (!lf.value) return

  const graphData = lf.value.getGraphData() as any
  if (!graphData) return

  graphData.nodes?.forEach((node: any) => {
    node.properties = { ...node.properties, isDebug: val }
  })
  graphData.edges?.forEach((edge: any) => {
    edge.properties = { ...edge.properties, isDebug: val }
  })

  lf.value.render(graphData)
}

/**
 * 自动排版触发
 */
const handleCalibrate = () => {
  autoLayoutAndCenter({ showNotification: true })
}

/**
 * 打开工作流示范模板选择弹窗
 */
const handleLoadDemo = () => {
  if (!lf.value) return
  templateVisible.value = true
}

/**
 * 载入所选工作流示范模板
 */
const handleSelectTemplate = (tpl: WorkflowTemplateItem) => {
  if (!lf.value) return

  const doLoad = () => {
    // 重新载入模板时，自动关闭并重置调试模式
    if (isDebugMode.value) {
      isDebugMode.value = false
    }
    const templateData = tpl.createGraph(uuidv4)
    lf.value?.render(templateData)
    emits("update:formData", {
      ...props.formData,
      flow_data: cleanGraphData(templateData)
    })
    nextTick(() => {
      autoLayoutAndCenter({ showNotification: false })
      updateCounts()
      ElMessage.success(`已成功载入「${tpl.name}」模板！`)
    })
  }

  // 画布已有复杂拓扑时，弹出确认提示
  if (nodeCount.value > 2 || edgeCount.value > 0) {
    ElMessageBox.confirm(`加载「${tpl.name}」将重置并覆盖当前画布已有内容，是否继续？`, "载入示例模板", {
      confirmButtonText: "确认注入",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => doLoad())
      .catch(() => {})
  } else {
    doLoad()
  }
}

/**
 * 绑定 LogicFlow 原生画布交互事件
 */
const bindLogicFlowEvents = (instance: LogicFlow) => {
  instance.on("node:click", ({ data }: any) => {
    nodeData.value = data
    if (isGatewayType(data.type)) {
      handleSelectGateway(data)
      showAttribute.value = false
    } else {
      clearSelectedGateway()
      if (["start", "user", "automation", "chat"].includes(data.type)) {
        showAttribute.value = true
      }
    }
  })

  // 双击网关节点直接唤起属性抽屉
  instance.on("node:dbclick", ({ data }: any) => {
    nodeData.value = data
    if (isGatewayType(data.type)) {
      showAttribute.value = true
    }
  })

  instance.on("edge:click", ({ data }: any) => {
    clearSelectedGateway()
    nodeData.value = data
    showAttribute.value = true
  })

  instance.on("blank:click", () => {
    clearSelectedGateway()
  })

  instance.on("node:add", (args: any) => {
    if (isDebugMode.value) {
      instance.setProperties(args.data.id, { isDebug: true })
    }
    syncFormData()
  })

  instance.on("edge:add", (args: any) => {
    const { data } = args
    // 拦截自连线（防死环）
    if (data.sourceNodeId === data.targetNodeId) {
      if (data.properties?.style) return
      instance.deleteEdge(data.id)
      ElNotification({
        title: "不允许自连线",
        message: "节点不能连接自身",
        type: "warning",
        duration: 2000,
        position: "top-right"
      })
      return
    }
    if (isDebugMode.value) {
      instance.setProperties(data.id, { isDebug: true })
    }
    syncFormData()
  })

  instance.on("node:delete", (args: any) => {
    if (selectedGatewayNode.value?.id === args?.data?.id) {
      clearSelectedGateway()
    }
    syncFormData()
  })

  instance.on("edge:delete", syncFormData)
  instance.on("history:change", syncFormData)
}

/**
 * 初始化 LogicFlow 实例
 */
const initLf = () => {
  if (!container.value) return

  const lfInstance = new LogicFlow({
    background: { backgroundColor: "#f8fafc" },
    grid: { size: 20, visible: true, type: "dot", color: "#e2e8f0", thickness: 1, snapToGrid: true },
    keyboard: { enabled: true },
    edgeTextDraggable: true,
    hoverOutline: true,
    moveData: {},
    nodeList: WORKFLOW_NODES,
    style: { rect: { radius: 8 }, circle: { radius: 20 } },
    wheel: { enabled: true, step: 0.5, wheelZoom: 0.1, touchpadZoom: 0.05 },
    drag: { enabled: true, step: 1, throttle: 16 },
    guards: {
      beforeDelete: (element: any) => {
        if (element.type !== "automation" || !element.id) return true
        const references = findCompensationNodeReferences((lf.value?.getGraphData() as any)?.nodes || [], element.id)
        if (references.length === 0) return true
        const sourceNames = references.map((reference) => `「${reference.name}」`).join("、")
        ElNotification({
          title: "无法删除补偿节点",
          message: `${sourceNames}已将该节点设为撤回补偿，请先解除绑定`,
          type: "warning",
          duration: 3500,
          position: "top-right"
        })
        return false
      }
    },
    plugins: [Menu, MiniMap, Snapshot, SelectionSelect, Dagre, ProximityConnect],
    container: container.value
  } as any)

  lf.value = lfInstance

  // 应用主题样式
  applyWorkflowTheme(lfInstance)

  // 注册节点扩展
  registerAllNodes(lfInstance)

  // 绑定交互事件
  bindLogicFlowEvents(lfInstance)

  // 初始图数据渲染
  renderGraphData(props.formData.flow_data)

  // 禁用节点拖拽时的渐进连线
  if ((lfInstance.extension as any)?.proximityConnect) {
    ;(lfInstance.extension as any).proximityConnect.handleNodeDrag = () => {}
  }
}

// 导航与查看数据
const handleNext = () => {
  if (lf.value) {
    const graphData = lf.value.getGraphData()
    if (graphData) {
      // 校验工作流合法性（拦截致命错误）
      const validation = validateWorkflowGraph(graphData)
      if (!validation.valid) {
        ElMessage.error(validation.errors[0])
        return
      }

      // 如果有警告项，弹出提示但不阻断
      if (validation.warnings.length > 0) {
        ElNotification({
          title: "流程设计建议",
          message: validation.warnings[0],
          type: "warning",
          duration: 3500,
          position: "top-right"
        })
      }

      emits("update:formData", { ...props.formData, flow_data: cleanGraphData(graphData) })
    }
  }
  next()
}

const getData = () => {
  if (lf.value) {
    graph.value = lf.value.getGraphData()
    dataVisible.value = true
  }
}

const handleCopyDataJson = () => {
  if (dataDialogRef.value?.copyJson) {
    dataDialogRef.value.copyJson()
  }
}

const download = () => {
  return lf.value?.getSnapshot()
}

onMounted(() => {
  initLf()
})

onUnmounted(() => {
  if (lf.value && typeof lf.value.destroy === "function") {
    lf.value.destroy()
  }
})

watch(
  () => props.formData,
  (newFormData) => {
    setFormData(newFormData)
  },
  { deep: true, immediate: true }
)

watch(
  () => props.formData.flow_data,
  (flowData) => {
    if (isSyncingFromCanvas.value) return
    renderGraphData(flowData)
  },
  { deep: true }
)
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
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  min-height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.workflow-stats {
  display: flex;
  gap: 8px;

  .stat-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: #f1f5f9;
    border-radius: 6px;
    font-size: 12px;

    .stat-label {
      color: #64748b;
    }
    .stat-value {
      font-weight: 700;
      color: #0f172a;
    }
  }
}

.logic-flow-view {
  display: flex;
  flex: 1;
  position: relative;
  overflow: hidden;
}

.node-sidebar {
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;
  z-index: 10;
}

.canvas-container {
  flex: 1;
  position: relative;
  background: #f8fafc;
  overflow: hidden;

  #LF-view {
    width: 100%;
    height: 100%;
  }
}
</style>
