<template>
  <div class="logic-flow-preview">
    <div id="LF-preview" ref="container" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, nextTick, onMounted } from "vue"
import LogicFlow from "@logicflow/core"
import { Menu, Snapshot, MiniMap } from "@logicflow/extension"
import "@logicflow/core/dist/index.css"
import "@logicflow/extension/lib/style/index.css"
import { nodeList } from "@@/components/workflow/config"
import {
  registerStart,
  registerEnd,
  registerCondition,
  registerUser,
  registerParallel,
  regsiterInclusion,
  registerAutomation,
  registerPolyline
} from "@@/components/workflow/RegisterNode/index"
import { getWorkflowGraphApi } from "@/api/workflow/workflow"

interface Props {
  workflowId: number | undefined
  processInstId: number | undefined
  status: number | undefined
}
const props = defineProps<Props>()

const lf = ref()
const container = ref()
const config = reactive<any>({
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
  nodeList: nodeList
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
      color: "#000000"
    },
    edgeText: {
      color: "#000000",
      background: {
        fill: "#f7f9ff"
      }
    }
  })
}

const registerNode = () => {
  registerStart(lf.value)
  registerEnd(lf.value)
  registerCondition(lf.value)
  registerUser(lf.value)
  registerPolyline(lf.value)
  registerParallel(lf.value)
  regsiterInclusion(lf.value)
  registerAutomation(lf.value)
}

const render = () => {
  lf.value.render()
  // 居中展示
  lf.value.translateCenter()
  // 流程图缩小到画布能全部显示
  lf.value.fitView(300, 300)
}

const getGraphData = async (id: number, process_instance_id: number, status: number) => {
  const res = await getWorkflowGraphApi({
    id: id,
    process_instance_id: process_instance_id,
    status: status
  })
  return res.data
}

onMounted(() => {
  initLf()
})

// 获取线条颜色
watch(
  () => props.workflowId,
  (val) => {
    if (val) {
      nextTick(async () => {
        // 设置线条颜色
        // const edgeModel = lf.value.getEdgeModelById("6775fe22-5d52-4b6a-90aa-1a2ec298d4a0")
        // edgeModel.setProperties({
        //   isPass: true
        // })

        if (props.processInstId != undefined && props.status != undefined) {
          const workflowGraph = await getGraphData(val, props.processInstId, props.status)
          lf.value.render(workflowGraph?.workflow?.flow_data)
          // 居中展示
          lf.value.translateCenter()
          // 流程图缩小到画布能全部显示
          lf.value.fitView(300, 300)
        }
      })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.logic-flow-preview {
  display: flex;
  flex-direction: column;
  height: 70vh;
}

#LF-preview {
  flex: 1;
  outline: none;
}
</style>
