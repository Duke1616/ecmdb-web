<template>
  <div class="logic-flow-view">
    <!-- 辅助工具栏 -->
    <Control class="control" v-if="lf" @getData="getData" @download="download" />
    <!-- 节点面板 -->
    <NodePanel v-if="lf" :lf="lf" :nodeList="nodeList" />
    <!-- 画布 -->
    <div id="LF-view" ref="container" />
    <!-- 数据查看面板 -->
    <el-dialog title="数据" v-model="dataVisible" class="data-dialog">
      <DataDialog :graph="graph" />
    </el-dialog>
    <!-- 属性面板 -->
    <PropertyDialog
      v-if="showAttribute"
      :nodeData="nodeData"
      :flowDetail="flowDetail"
      :lf="lf"
      :id="formData.id"
      @closed="showAttribute = false"
    />
  </div>
  <div class="lf-button">
    <el-button @click="previous">上一步</el-button>
    <el-button @click="next" type="primary">下一步</el-button>
    <el-button @click="onClosed">取消</el-button>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick, onMounted, watch } from "vue"
import LogicFlow from "@logicflow/core"
import { Menu, Snapshot, MiniMap } from "@logicflow/extension"
import "@logicflow/core/dist/index.css"
import "@logicflow/extension/lib/style/index.css"
import NodePanel from "@/components/workflow/LFComponents/NodePanel.vue"
import Control from "@/components/workflow/LFComponents/Control.vue"
import DataDialog from "@/components/workflow/LFComponents/DataDialog.vue"
import PropertyDialog from "@/components/workflow/PropertySetting/PropertyDialog.vue"
import { nodeList } from "@/components/workflow/config"
import {
  registerStart,
  registerEnd,
  registerCondition,
  registerParallel,
  regsiterInclusion,
  registerAutomation,
  registerUser,
  registerEdge
} from "@/components/workflow/RegisterNode/index"
import { createOrUpdateWorkflowReq } from "@/api/workflow/types/workflow"

interface Props {
  formData: createOrUpdateWorkflowReq
}
const props = defineProps<Props>()

const emits = defineEmits(["previous", "next", "close", "update:formData"])
const next = () => {
  localFormData.value.flow_data = lf.value.getGraphData()
  emits("update:formData", localFormData.value)
  emits("next")
}

const previous = () => {
  localFormData.value.flow_data = lf.value.getGraphData()
  emits("update:formData", localFormData.value)
  emits("previous")
}

const onClosed = () => {
  emits("close")
}

const flowDetail = reactive<Object>({})
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
  registerUser(lf.value)
  registerCondition(lf.value)
  registerEdge(lf.value)
  registerParallel(lf.value)
  regsiterInclusion(lf.value)
  registerAutomation(lf.value)
}

const render = () => {
  lf.value.translateCenter()
  LfEvent()
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
}

const graph = ref()
const dataVisible = ref<boolean>(false)
const getData = () => {
  graph.value = lf.value.getGraphData()
  dataVisible.value = true
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

const localFormData = ref({ ...props.formData })
/** 监听消息是否变更 */
watch(
  () => props.formData,
  (val: createOrUpdateWorkflowReq) => {
    localFormData.value = { ...val }
    nextTick(() => {
      lf.value.render(val.flow_data)

      lf.value.translateCenter()
    })
  },
  { immediate: true }
)

defineExpose({
  getGraphData
})
</script>

<style scoped>
.logic-flow-view {
  height: 70vh;
  position: relative;
}
#LF-view {
  width: calc(100% - 100px);
  height: 100%;
  outline: none;
  margin-left: 50px;
}

.control {
  position: absolute;
  /* top: 60px; */
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

.lf-button {
  margin-left: 50px;
  margin-top: 12px;
}

@keyframes lf_animate_dash {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
