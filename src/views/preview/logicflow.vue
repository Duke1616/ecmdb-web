<template>
  <div class="logic-flow-preview">
    <div id="LF-preview" ref="container" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
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
  registerEdge
} from "@@/components/workflow/RegisterNode/index"

const lf = ref()
const data = ref()
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

const initLf = (data: any) => {
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
  lf.value.render(data)
  // 居中展示
  lf.value.translateCenter()
  // 流程图缩小到画布能全部显示
  lf.value.fitView(300, 300)
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
  registerEdge(lf.value)
  registerParallel(lf.value)
  regsiterInclusion(lf.value)
  registerAutomation(lf.value)
}

onMounted(() => {
  // 确保数据已经通过 window.__DATA__ 注入
  if (window.__DATA__) {
    data.value = window.__DATA__ // 使用 ref 获取数据
    initLf(data.value) // 渲染数据
  } else {
    console.warn("没有找到传递的数据 (window.__DATA__)")
  }
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
