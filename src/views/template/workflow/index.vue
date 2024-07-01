<template>
  <div class="logic-flow-view">
    <h3 class="title">流程控制</h3>
    <!-- 辅助工具栏 -->
    <Control class="control" v-if="lf" @getData="getData" />
    <!-- 节点面板 -->
    <NodePanel v-if="lf" :lf="lf" :nodeList="nodeList" />
    <!-- 画布 -->
    <div id="LF-view" ref="container" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import LogicFlow from "@logicflow/core"
import { Menu, Snapshot, MiniMap } from "@logicflow/extension"
import "@logicflow/core/dist/index.css"
import "@logicflow/extension/lib/style/index.css"
import NodePanel from "@/components/workflow/LFComponents/NodePanel.vue"
import Control from "@/components/workflow/LFComponents/Control.vue"
import { nodeList } from "./config"
import { registerStart, registerEnd } from "@/components/workflow/RegisterNode/index"

const lf = ref()
const nodeData = ref()
const showAttribute = ref(false)
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

const graphData = {
  nodes: [
    {
      id: "742356ea-762b-4899-b96a-bd567e3c4361",
      type: "start",
      x: 220,
      y: 170,
      text: {
        x: 350,
        y: 190,
        value: "sdfasf"
      },
      properties: {},
      baseType: "node"
    },
    {
      id: "b119f24f-2669-4a90-a837-afd853b2ffcc",
      type: "end",
      x: 990,
      y: 320,
      properties: {},
      baseType: "node"
    }
  ]
}

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
}

const render = () => {
  lf.value.render(graphData)
  LfEvent()
}

const LfEvent = () => {
  lf.value.on("node:click", ({ data }: any) => {
    console.log("node:click", data)
    nodeData.value = data
    if (
      ["start", "assignment", "decision", "startParallel", "endParallel", "machineLearning", "deepLearning"].includes(
        data.type
      )
    ) {
      showAttribute.value = true
    }
  })
}

const graph = ref()
const dataVisible = ref<boolean>(false)
const getData = () => {
  graph.value = lf.value.getGraphData()
  console.log("data", graph.value)
  dataVisible.value = true
}

onMounted(() => {
  initLf()
})
</script>

<style scoped>
#LF-view {
  width: calc(100% - 100px);
  height: 80%;
  outline: none;
  margin-left: 50px;
}
.logic-flow-view {
  height: 100vh;
  position: relative;
}
.title {
  text-align: center;
  margin: 20px;
}
.control {
  position: absolute;
  top: 60px;
  right: 50px;
  z-index: 2;
}

.time-plus {
  cursor: pointer;
}
.add-panel {
  position: absolute;
  z-index: 11;
  background-color: white;
  padding: 10px 5px;
}
.el-drawer__body {
  height: 80%;
  overflow: auto;
  margin-top: -30px;
  z-index: 3;
}

@keyframes lf_animate_dash {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
