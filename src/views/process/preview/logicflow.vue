<template>
  <div class="logic-flow-preview">
    <div id="LF-preview" ref="containerRef" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue"
import { v4 as uuidv4 } from "uuid"
import LogicFlow from "@logicflow/core"
import { Menu, MiniMap, Snapshot } from "@logicflow/extension"
import "@logicflow/core/dist/index.css"
import "@logicflow/extension/lib/style/index.css"
import {
  registerStart,
  registerEnd,
  registerCondition,
  registerUser,
  registerParallel,
  registerSelective,
  regsiterInclusion,
  registerAutomation,
  registerPolyline
} from "@@/components/workflow/RegisterNode/index"

const lf = ref()
const containerRef = ref() as Ref<HTMLDivElement>

const config = reactive<any>({
  background: {
    backgroundColor: "#EFF2F6"
  }
})

const initLf = (data: any) => {
  const lfInstance = new LogicFlow({
    ...config,
    plugins: [Menu, MiniMap, Snapshot],
    container: containerRef.value
  })
  lf.value = lfInstance
  console.log("LogicFlow instance created:", lfInstance)

  // 设置主题
  setThemem()

  // 注册节点
  registerNode()

  // 加载数据
  lf.value.render(data)

  // 等待渲染完成后进行居中和缩放
  nextTick(() => {
    lf.value.translateCenter()
    lf.value.fitView()

    const el = document.getElementById("LF-preview")
    if (el) {
      el.setAttribute("data-rendered", "true")
    }
  })
}

const setThemem = () => {
  lf.value.setTheme({
    circle: {
      stroke: "#3b82f6",
      strokeWidth: 3,
      outlineColor: "#1d4ed8",
      outlineWidth: 2,
      fill: "#ffffff",
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    },
    rect: {
      outlineColor: "#3b82f6",
      outlineWidth: 2,
      stroke: "#3b82f6",
      strokeWidth: 3,
      fill: "#ffffff",
      radius: 12,
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    },
    polygon: {
      stroke: "#3b82f6",
      strokeWidth: 3,
      fill: "#ffffff",
      outlineColor: "#1d4ed8",
      outlineWidth: 2,
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    },
    polyline: {
      stroke: "#6b7280",
      strokeWidth: 3,
      hoverStroke: "#3b82f6",
      selectedStroke: "#1d4ed8",
      outlineColor: "#9ca3af",
      outlineWidth: 1,
      arrow: {
        stroke: "#6b7280",
        fill: "#6b7280"
      }
    },
    nodeText: {
      color: "#1f2937",
      fontSize: 16,
      fontWeight: 600,
      textAlign: "center",
      textVerticalAlign: "middle"
    },
    edgeText: {
      color: "#4b5563",
      fontSize: 14,
      fontWeight: 500,
      background: {
        fill: "#EFF2F6",
        stroke: "#d1d5db",
        strokeWidth: 2,
        radius: 8,
        padding: 8
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
  registerSelective(lf.value)
  regsiterInclusion(lf.value)
  registerAutomation(lf.value)
}

const demo = {
  nodes: [
    {
      id: uuidv4(),
      type: "start",
      x: 350,
      y: 160,
      properties: {}
    },
    {
      id: uuidv4(),
      type: "end",
      x: 610,
      y: 160,
      properties: {}
    }
  ],
  edges: []
}

onMounted(() => {
  const MAX_WAIT = 3000
  const INTERVAL = 50
  let waited = 0

  const timer = setInterval(() => {
    if (window.__DATA__) {
      clearInterval(timer)
      try {
        initLf(window.__DATA__)
      } catch (e) {
        console.error("LogicFlow init error:", e)
      }
      return
    }

    waited += INTERVAL
    if (waited >= MAX_WAIT) {
      clearInterval(timer)
      console.warn("No data injected after timeout, rendering DEMO data.")

      // 如果是本地预览模式，将容器调整为视口大小，以便正确居中显示
      const wrapper = document.querySelector(".logic-flow-preview") as HTMLElement
      const container = document.getElementById("LF-preview")
      if (wrapper && container) {
        wrapper.style.width = "100vw"
        wrapper.style.height = "100vh"
        container.style.width = "100%"
        container.style.height = "100%"
      }

      initLf(demo)
    }
  }, INTERVAL)
})
</script>

<style scoped>
.logic-flow-preview {
  display: block;
  width: 1920px;
  height: 1080px;
  position: fixed;
  top: 0;
  left: 0;
  background: #eff2f6;
  z-index: 1000;
  overflow: hidden;
}

#LF-preview {
  width: 1920px;
  height: 1080px;
  outline: none;
  background: #eff2f6;
  border-radius: 0;
}
</style>
