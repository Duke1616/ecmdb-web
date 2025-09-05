<template>
  <div class="logic-flow-preview">
    <div id="LF-preview" ref="container" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, nextTick } from "vue"
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

const lf = ref()
const data = ref()
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

const initLf = (data: any) => {
  // 如果数据是字符串，解析为对象
  let flowData = data
  if (typeof data === 'string') {
    try {
      flowData = JSON.parse(data)
    } catch (error) {
      console.error("Failed to parse flow data:", error)
      return
    }
  }

  // 如果已经有 LogicFlow 实例，先销毁
  if (lf.value) {
    lf.value.destroy()
  }

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

  // 加载数据
  lf.value.render(flowData)
  
  // 等待渲染完成后进行居中和缩放
  nextTick(() => {
    // 居中展示
    lf.value.translateCenter()
    // 流程图缩小到画布能全部显示
    lf.value.fitView(300, 300)
  })
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
      stroke: "#667eea",
      strokeWidth: 2,
      fill: "#ffffff",
      outlineColor: "#667eea",
      outlineWidth: 1
    },
    polyline: {
      stroke: "#667eea",
      strokeWidth: 2,
      hoverStroke: "#667eea",
      selectedStroke: "#667eea",
      outlineColor: "#667eea",
      outlineWidth: 1
    },
    nodeText: {
      color: "#374151",
      fontSize: 14,
      fontWeight: 500
    },
    edgeText: {
      color: "#6b7280",
      fontSize: 12,
      background: {
        fill: "#ffffff",
        stroke: "#e5e7eb",
        strokeWidth: 1,
        radius: 4
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
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  background: #f8fafc;
}

#LF-preview {
  flex: 1;
  outline: none;
  min-height: 600px;
  width: 100%;
}
</style>
