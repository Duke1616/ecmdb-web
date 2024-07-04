<template>
  <el-dialog v-model="dataVisible" width="60%" @closed="onClosed">
    <div class="logic-flow-preview">
      <div id="LF-preview" ref="container" />
    </div>
    <!-- <el-button @click="onClosed">关闭</el-button> -->
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch, nextTick } from "vue"
import LogicFlow from "@logicflow/core"
import { Menu, Snapshot, MiniMap } from "@logicflow/extension"
import "@logicflow/core/dist/index.css"
import "@logicflow/extension/lib/style/index.css"
import { nodeList } from "../config"
import { registerStart, registerEnd, registerCondition, registerUser } from "@/components/workflow/RegisterNode/index"

interface Props {
  data: any
  PreviewDialogvisble: boolean
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
}

const render = () => {
  lf.value.render(props.data)
}
const dataVisible = ref<boolean>(false)
const emits = defineEmits(["close"])
const onClosed = () => {
  emits("close")
}
watch(
  () => props.PreviewDialogvisble, // 确保属性名称正确
  (val: boolean) => {
    dataVisible.value = val
    if (val) {
      nextTick(() => {
        initLf()
        lf.value.render(props.data)
      })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* .logic-flow-preview {
  height: 70vh;
  position: relative;
}

#LF-preview {
  width: calc(100% - 100px);
  height: 100%;
  outline: none;
  margin-left: 50px;
} */

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
