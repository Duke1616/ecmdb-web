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
    backgroundColor: "#ffffff"
  },
  grid: {
    size: 30,
    visible: true,
    type: "dot",
    color: "#f1f5f9",
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
      radius: 12
    },
    circle: {
      radius: 25
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
  console.log("initLf called with data:", data)

  // 如果数据是字符串，解析为对象
  let flowData = data
  if (typeof data === "string") {
    try {
      flowData = JSON.parse(data)
      console.log("Parsed JSON data:", flowData)
    } catch (error) {
      console.error("Failed to parse flow data:", error)
      return
    }
  }

  // 如果已经有 LogicFlow 实例，先销毁
  if (lf.value) {
    console.log("Destroying existing LogicFlow instance")
    lf.value.destroy()
  }

  console.log("Creating new LogicFlow instance with container:", container.value)

  try {
    const lfInstance = new LogicFlow({
      ...config,
      plugins: [Menu, MiniMap, Snapshot],
      container: container.value
    })
    lf.value = lfInstance
    console.log("LogicFlow instance created:", lfInstance)

    // 设置主题
    setThemem()

    // 注册节点
    registerNode()

    // 加载数据
    console.log("Rendering data:", flowData)
    lf.value.render(flowData)

    // 等待渲染完成后进行居中和缩放
    nextTick(() => {
      console.log("NextTick in initLf, calling translateCenter and fitView")
      try {
        lf.value.translateCenter()
        lf.value.fitView(300, 300)
        console.log("LogicFlow rendered successfully")

        // 给 chromedp 一个标记
        const el = document.getElementById("LF-preview")
        if (el) {
          el.setAttribute("data-ready", "true")
          console.log("Set data-ready attribute")
        }
      } catch (error) {
        console.error("Error in nextTick:", error)
      }
    })
  } catch (error) {
    console.error("Error creating LogicFlow instance:", error)
  }
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
        fill: "#ffffff",
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
  regsiterInclusion(lf.value)
  registerAutomation(lf.value)
}

// 生成测试数据
const generateTestData = () => {
  return {
    nodes: [
      // 开始节点
      {
        id: "start-1",
        type: "start",
        x: 100,
        y: 100,
        text: "流程开始",
        properties: {
          name: "流程开始",
          description: "工作流程的起始点"
        }
      },
      // 用户节点
      {
        id: "user-1",
        type: "user",
        x: 300,
        y: 100,
        text: "用户审批",
        properties: {
          name: "用户审批",
          description: "需要用户手动审批的环节",
          assignee: "张三",
          dueDate: "2024-01-15"
        }
      },
      // 条件节点
      {
        id: "condition-1",
        type: "condition",
        x: 500,
        y: 100,
        text: "金额判断",
        properties: {
          name: "金额判断",
          description: "根据金额大小决定流程走向",
          condition: "amount > 10000"
        }
      },
      // 自动化节点
      {
        id: "automation-1",
        type: "automation",
        x: 700,
        y: 50,
        text: "自动处理",
        properties: {
          name: "自动处理",
          description: "系统自动处理小金额申请",
          script: "processSmallAmount()"
        }
      },
      // 并行节点
      {
        id: "parallel-1",
        type: "parallel",
        x: 700,
        y: 150,
        text: "并行审批",
        properties: {
          name: "并行审批",
          description: "多个部门同时审批",
          participants: ["财务部", "法务部", "技术部"]
        }
      },
      // 包容节点
      {
        id: "inclusion-1",
        type: "inclusion",
        x: 900,
        y: 100,
        text: "包含子流程",
        properties: {
          name: "包含子流程",
          description: "包含其他子流程",
          subProcess: "approval-subprocess"
        }
      },
      // 用户节点2
      {
        id: "user-2",
        type: "user",
        x: 1100,
        y: 100,
        text: "最终审批",
        properties: {
          name: "最终审批",
          description: "部门经理最终审批",
          assignee: "李四",
          role: "manager"
        }
      },
      // 结束节点
      {
        id: "end-1",
        type: "end",
        x: 1300,
        y: 100,
        text: "流程结束",
        properties: {
          name: "流程结束",
          description: "工作流程的结束点"
        }
      },
      // 拒绝分支的结束节点
      {
        id: "end-2",
        type: "end",
        x: 500,
        y: 250,
        text: "流程拒绝",
        properties: {
          name: "流程拒绝",
          description: "申请被拒绝"
        }
      }
    ],
    edges: [
      {
        id: "edge-1",
        type: "polyline",
        sourceNodeId: "start-1",
        targetNodeId: "user-1",
        text: "提交申请",
        properties: {
          label: "提交申请"
        }
      },
      {
        id: "edge-2",
        type: "polyline",
        sourceNodeId: "user-1",
        targetNodeId: "condition-1",
        text: "审批通过",
        properties: {
          label: "审批通过"
        }
      },
      {
        id: "edge-3",
        type: "polyline",
        sourceNodeId: "condition-1",
        targetNodeId: "automation-1",
        text: "金额 ≤ 10000",
        properties: {
          label: "金额 ≤ 10000"
        }
      },
      {
        id: "edge-4",
        type: "polyline",
        sourceNodeId: "condition-1",
        targetNodeId: "parallel-1",
        text: "金额 > 10000",
        properties: {
          label: "金额 > 10000"
        }
      },
      {
        id: "edge-5",
        type: "polyline",
        sourceNodeId: "parallel-1",
        targetNodeId: "inclusion-1",
        text: "并行审批完成",
        properties: {
          label: "并行审批完成"
        }
      },
      {
        id: "edge-6",
        type: "polyline",
        sourceNodeId: "automation-1",
        targetNodeId: "inclusion-1",
        text: "自动处理完成",
        properties: {
          label: "自动处理完成"
        }
      },
      {
        id: "edge-7",
        type: "polyline",
        sourceNodeId: "inclusion-1",
        targetNodeId: "user-2",
        text: "子流程完成",
        properties: {
          label: "子流程完成"
        }
      },
      {
        id: "edge-8",
        type: "polyline",
        sourceNodeId: "user-2",
        targetNodeId: "end-1",
        text: "审批通过",
        properties: {
          label: "审批通过"
        }
      },
      {
        id: "edge-9",
        type: "polyline",
        sourceNodeId: "user-1",
        targetNodeId: "end-2",
        text: "审批拒绝",
        properties: {
          label: "审批拒绝"
        }
      }
    ]
  }
}

// 优化真实数据的布局
const optimizeRealData = () => {
  const realData = JSON.parse('{"edges":[{"endPoint":{"x":-74,"y":160},"id":"596eeddb-304f-4660-82ee-c74d84661a94","pointsList":[{"x":-160,"y":160},{"x":-74,"y":160}],"properties":{"is_pass":true},"sourceNodeId":"406eb05e-e0c0-428c-b123-9b1a5375acf9","startPoint":{"x":-160,"y":160},"targetNodeId":"b844fa11-03f9-45de-8ee8-e39bf1649976","text":null,"type":"polyline"},{"endPoint":{"x":66,"y":20},"id":"ee3460dc-089e-446f-b467-5d0ba940c494","pointsList":[{"x":-40,"y":126},{"x":-40,"y":20},{"x":66,"y":20}],"properties":{},"sourceNodeId":"b844fa11-03f9-45de-8ee8-e39bf1649976","startPoint":{"x":-40,"y":126},"targetNodeId":"7fc2d714-b4af-4ad6-89a3-270b85b2e4c7","text":null,"type":"polyline"},{"endPoint":{"x":66,"y":280},"id":"fb07bd2c-ee22-4321-bee3-e5c247226a88","pointsList":[{"x":-40,"y":194},{"x":-40,"y":280},{"x":66,"y":280}],"properties":{"is_pass":true},"sourceNodeId":"b844fa11-03f9-45de-8ee8-e39bf1649976","startPoint":{"x":-40,"y":194},"targetNodeId":"12e35964-7d91-4bc2-b29c-5e5f72663c33","text":null,"type":"polyline"},{"endPoint":{"x":266,"y":160},"id":"3081329a-b7c8-4640-b892-342a5cb1e0d1","pointsList":[{"x":134,"y":280},{"x":236,"y":280},{"x":236,"y":160},{"x":266,"y":160}],"properties":{"is_pass":true},"sourceNodeId":"12e35964-7d91-4bc2-b29c-5e5f72663c33","startPoint":{"x":134,"y":280},"targetNodeId":"a9808a51-c3ef-4198-91e0-fa5f4788ba08","text":null,"type":"polyline"},{"endPoint":{"x":266,"y":160},"id":"d08f6387-845f-47fd-b852-fb8fa2114749","pointsList":[{"x":134,"y":20},{"x":236,"y":20},{"x":236,"y":160},{"x":266,"y":160}],"properties":{},"sourceNodeId":"7fc2d714-b4af-4ad6-89a3-270b85b2e4c7","startPoint":{"x":134,"y":20},"targetNodeId":"a9808a51-c3ef-4198-91e0-fa5f4788ba08","text":null,"type":"polyline"},{"endPoint":{"x":485,"y":40},"id":"4f3c64b2-0ab3-4a04-b566-58b47cd61d16","pointsList":[{"x":300,"y":126},{"x":300,"y":40},{"x":485,"y":40}],"properties":{},"sourceNodeId":"a9808a51-c3ef-4198-91e0-fa5f4788ba08","startPoint":{"x":300,"y":126},"targetNodeId":"f2c705ac-5f1d-49f7-99e8-0b3557d5a861","text":null,"type":"polyline"},{"endPoint":{"x":485,"y":260},"id":"2171d25a-e85e-49e6-891a-b2f913c3d8b9","pointsList":[{"x":300,"y":194},{"x":300,"y":260},{"x":485,"y":260}],"properties":{"is_pass":true},"sourceNodeId":"a9808a51-c3ef-4198-91e0-fa5f4788ba08","startPoint":{"x":300,"y":194},"targetNodeId":"6623b0fd-5d6c-4801-95e5-247a3f661420","text":null,"type":"polyline"},{"endPoint":{"x":700,"y":194},"id":"4a2e92f8-21d7-4133-81a4-99bce06a92cc","pointsList":[{"x":555,"y":260},{"x":700,"y":260},{"x":700,"y":194}],"properties":{"is_pass":true},"sourceNodeId":"6623b0fd-5d6c-4801-95e5-247a3f661420","startPoint":{"x":555,"y":260},"targetNodeId":"b5df15ef-08e0-4089-a7cd-053863888517","text":null,"type":"polyline"},{"endPoint":{"x":700,"y":126},"id":"a7d16e8e-cd07-4c3c-928b-a2fbc7f86ed1","pointsList":[{"x":555,"y":40},{"x":700,"y":40},{"x":700,"y":126}],"properties":{},"sourceNodeId":"f2c705ac-5f1d-49f7-99e8-0b3557d5a861","startPoint":{"x":555,"y":40},"targetNodeId":"b5df15ef-08e0-4089-a7cd-053863888517","text":null,"type":"polyline"},{"endPoint":{"x":940,"y":160},"id":"9c7ab066-d576-415a-b36a-ea7e17b99b33","pointsList":[{"x":734,"y":160},{"x":940,"y":160}],"properties":{"is_pass":true},"sourceNodeId":"b5df15ef-08e0-4089-a7cd-053863888517","startPoint":{"x":734,"y":160},"targetNodeId":"0084d6a1-392d-4c44-846a-fb488dc05cd5","text":null,"type":"polyline"}],"nodes":[{"id":"406eb05e-e0c0-428c-b123-9b1a5375acf9","properties":{"is_notify":true},"type":"start","x":-180,"y":160},{"id":"0084d6a1-392d-4c44-846a-fb488dc05cd5","properties":{},"type":"end","x":960,"y":160},{"id":"b5df15ef-08e0-4089-a7cd-053863888517","properties":{},"type":"parallel","x":700,"y":160},{"id":"f2c705ac-5f1d-49f7-99e8-0b3557d5a861","properties":{"approved":[],"is_cc":true,"is_cosigned":false,"name":"工单提交人","rule":"founder","template_field":"","template_id":""},"text":{"value":"工单提交人","x":520,"y":90},"type":"user","x":520,"y":40},{"id":"6623b0fd-5d6c-4801-95e5-247a3f661420","properties":{"approved":["luankz"],"is_cc":true,"is_cosigned":false,"name":"测试人员","rule":"appoint","template_field":"","template_id":""},"text":{"value":"测试人员","x":520,"y":310},"type":"user","x":520,"y":260},{"id":"a9808a51-c3ef-4198-91e0-fa5f4788ba08","properties":{},"type":"parallel","x":300,"y":160},{"id":"b844fa11-03f9-45de-8ee8-e39bf1649976","properties":{},"type":"parallel","x":-40,"y":160},{"id":"7fc2d714-b4af-4ad6-89a3-270b85b2e4c7","properties":{"codebook_uid":"ui","exec_method":"template","is_notify":true,"is_timing":false,"name":"自动化-UI","notify_method":[1],"tag":"auto","template_field":"number","template_id":24,"topic":""},"text":{"value":"自动化-UI","x":100,"y":70},"type":"automation","x":100,"y":20},{"id":"12e35964-7d91-4bc2-b29c-5e5f72663c33","properties":{"codebook_uid":"smoke","is_notify":true,"name":"自动化-smoke","notify_method":[1],"tag":"auto","topic":""},"text":{"value":"自动化-smoke","x":100,"y":330},"type":"automation","x":100,"y":280}]}')
  
  // 重新布局节点，增加间距
  const scale = 1.5 // 放大系数
  const offsetX = 200 // X轴偏移
  const offsetY = 100 // Y轴偏移
  
  // 优化节点位置
  realData.nodes.forEach((node: any) => {
    node.x = (node.x + offsetX) * scale
    node.y = (node.y + offsetY) * scale
    
    // 更新文本位置
    if (node.text) {
      node.text.x = node.x
      node.text.y = node.y - 30
    }
  })
  
  // 更新边的位置
  realData.edges.forEach((edge: any) => {
    edge.startPoint.x = (edge.startPoint.x + offsetX) * scale
    edge.startPoint.y = (edge.startPoint.y + offsetY) * scale
    edge.endPoint.x = (edge.endPoint.x + offsetX) * scale
    edge.endPoint.y = (edge.endPoint.y + offsetY) * scale
    
    // 更新路径点
    if (edge.pointsList) {
      edge.pointsList.forEach((point: any) => {
        point.x = (point.x + offsetX) * scale
        point.y = (point.y + offsetY) * scale
      })
    }
  })
  
  return realData
}

onMounted(() => {
  // 确保数据已经通过 window.__DATA__ 注入
  if (window.__DATA__) {
    data.value = window.__DATA__ 
  } 

  // 等待下一个 tick 确保 DOM 完全渲染
  nextTick(() => {
    initLf(data.value)
  })
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
  background: #ffffff;
  z-index: 1000;
  overflow: hidden;
}

#LF-preview {
  flex: 1;
  outline: none;
  min-height: 600px;
  width: 100%;
  background: #ffffff;
  border-radius: 0;
}
</style>
