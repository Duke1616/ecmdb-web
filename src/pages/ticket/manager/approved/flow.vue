<template>
  <div class="logic-flow-preview">
    <div id="LF-preview" ref="container" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from "vue"
import LogicFlow from "@logicflow/core"
import { Menu, Snapshot, MiniMap } from "@logicflow/extension"
import "@logicflow/core/dist/index.css"
import "@logicflow/extension/lib/style/index.css"
import { WORKFLOW_NODES, registerAllNodes } from "@@/components/workflow/RegisterNode/index"
import { getWorkflowGraphApi } from "@/api/ticket/workflow/workflow"
import type { ProcessInstanceID } from "@/api/ticket/manager/types/manager"

interface Props {
  workflowId: number | undefined
  processInstId: ProcessInstanceID | undefined
  status: number | undefined
}
const props = defineProps<Props>()

const lf = ref<LogicFlow>()
const container = ref<HTMLElement>()
const config = {
  background: {
    backgroundColor: "#f7f9ff"
  },
  grid: {
    size: 10,
    visible: false
  },
  keyboard: {
    enabled: true
  },
  edgeTextDraggable: true,
  hoverOutline: false,
  moveData: {},
  nodeList: WORKFLOW_NODES
}

const initLf = () => {
  if (!container.value) return

  const lfInstance = new LogicFlow({
    ...config,
    plugins: [Menu, MiniMap, Snapshot],
    container: container.value
  })
  lf.value = lfInstance
  applyTheme()
  registerAllNodes(lfInstance)
  render()
}

const applyTheme = () => {
  lf.value?.setTheme({
    circle: {
      stroke: "#000000",
      strokeWidth: 1,
      outlineColor: "#88f"
    },
    rect: {
      outlineColor: "#88f",
      strokeWidth: 1
    },
    polygon: {
      strokeWidth: 1
    },
    polyline: {
      stroke: "#000000",
      hoverStroke: "#000000",
      selectedStroke: "#000000",
      outlineColor: "#88f",
      strokeWidth: 1
    },
    nodeText: {
      color: "#000000",
      fontSize: 12
    },
    edgeText: {
      color: "#000000",
      fontSize: 12,
      textWidth: 120,
      background: {
        fill: "#f7f9ff"
      }
    }
  })
}

const render = (graphData?: LogicFlow.GraphConfigData) => {
  if (!lf.value) return

  lf.value.render(graphData ?? { nodes: [], edges: [] })
  lf.value.translateCenter()
  lf.value.fitView(300, 300)
}

onMounted(() => {
  initLf()
})

watchEffect(async (onInvalidate) => {
  if (!lf.value || !props.workflowId || !props.processInstId || props.status === undefined) return

  let expired = false
  onInvalidate(() => {
    expired = true
  })

  const { data: workflowGraph } = await getWorkflowGraphApi({
    id: props.workflowId,
    process_instance_id: props.processInstId,
    status: props.status
  })
  if (expired) return

  render(workflowGraph?.workflow?.flow_data)
})
</script>

<style scoped>
.logic-flow-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
}

#LF-preview {
  flex: 1;
  outline: none;
}
</style>
