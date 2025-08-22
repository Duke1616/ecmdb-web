<template>
  <div>
    <div ref="myPage" style="margin-top: 0px; width: calc(100% - 10px); height: calc(100vh)">
      <RelationGraph ref="graphRef" :options="graphOptions" :on-node-click="onNodeClick" @refresh="listModelGraphData">
        <template #node="{ node }">
          <div
            class="my-node-style"
            :style="{ 'background-image': 'url(' + (node.data ? node.data.icon : '') + ')' }"
          />
          <div class="c-node-name" :style="{ color: node.color }">{{ node.text }}</div>
        </template>
      </RelationGraph>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import RelationGraph, { RGJsonData, RGNode, RGOptions, RelationGraphComponent } from "relation-graph-vue3"
import { listModelGraphApi } from "@/api/model"

const graphOptions: RGOptions = {
  debug: false,
  allowSwitchLineShape: true,
  allowSwitchJunctionPoint: true,
  allowShowDownloadButton: true,
  defaultJunctionPoint: "border",
  defaultLineWidth: 2,
  defaultLineColor: "#333333",
  allowShowMiniToolBar: true, // 是否显示工具栏
  defaultNodeShape: 0, // 默认的节点形状，0:圆形；1:矩形
  // defaultNodeColor: "rgba(66,187,66,1)",
  hideNodeContentByZoom: true, // 是否根据缩放比例隐藏节点内容
  defaultNodeBorderWidth: 0,
  defaultNodeColor: "rgba(238, 178, 94, 1)",
  defaultLineShape: 1,
  layouts: [
    {
      label: "自动布局",
      layoutName: "force",
      layoutClassName: "seeks-layout-force"
    }
  ]
}

const graphRef = ref<RelationGraphComponent>()

// 点击节点触发的函数
const onNodeClick = (nodeObject: RGNode) => {
  // 获取所有连线
  const graphInstance = graphRef.value!.getInstance()
  const allLinks = graphInstance.getLinks()

  allLinks.forEach((link) => {
    // 还原所有样式
    link.relations.forEach((line: any) => {
      line.color = line.data.orignColor || ""
      line.fontColor = line.data.orignFontColor || line.color || ""
      line.lineWidth = line.data.orignLineWidth || 1
    })
  })

  // 高亮与nodeObject相关的所有连线
  allLinks
    .filter((link) => link.fromNode === nodeObject || link.toNode === nodeObject)
    .forEach((link) => {
      link.relations.forEach((line: any) => {
        line.data.orignColor = line.color
        line.data.orignFontColor = line.fontColor || line.color
        line.data.orignLineWidth = line.lineWidth || 1
        line.color = "#ff0000"
        line.fontColor = "#ff0000"
        line.lineWidth = 3
      })
    })

  // 强制更新视图
  graphInstance.dataUpdated()
}

const modelGraphData = ref<RGJsonData>()
const listModelGraphData = () => {
  listModelGraphApi()
    .then(({ data }) => {
      modelGraphData.value = data
      setGraphData()
    })
    .catch(() => {
      modelGraphData.value = undefined
    })
    .finally(() => {})
}

const setGraphData = async () => {
  try {
    if (modelGraphData.value !== undefined) {
      const __graph_json_data: RGJsonData = modelGraphData.value
      const rootId = __graph_json_data.nodes[0].id
      __graph_json_data.rootId = rootId
      __graph_json_data.nodes.forEach((n) => {
        if (n.id !== rootId) {
          __graph_json_data.lines.push({ from: rootId, to: n.id, opacity: 0 })
        }
      })
      graphRef.value!.setJsonData(__graph_json_data, async (graphInstance) => {
        await graphInstance.moveToCenter()
        await graphInstance.zoomToFit()
      })
    }
  } catch (error) {
    console.error("获取数据时发生错误:", error)
  }
}

onMounted(() => {
  listModelGraphData()
})
</script>

<style lang="scss" scoped>
.my-node-style {
  background-position: center center;
  background-size: 100%;
  height: 100%;
  width: 100%;
  border-radius: 40px;
  overflow: visible;
}
.c-node-name {
  width: 80px;
  text-align: center;
  color: #2e74b5;
  margin-top: 10px;
}
</style>
