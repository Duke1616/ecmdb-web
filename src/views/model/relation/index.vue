<template>
  <div>
    <div ref="myPage" style="margin-top: 0px; width: calc(100% - 10px); height: calc(100vh)">
      <RelationGraph ref="graphRef" :options="graphOptions" :on-node-click="onNodeClick">
        <template #node="{ node }">
          <div class="my-node-style" :style="{ 'background-image': 'url(' + node.data.icon + ')' }" />
          <div class="c-node-name" :style="{ color: node.color }">{{ node.text }}</div>
        </template>
      </RelationGraph>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import RelationGraph, { RGJsonData, RGOptions, RelationGraphComponent } from "relation-graph-vue3"
import demoData from "./Demo4AdvDataFilterData copy.json"

const graphOptions: RGOptions = {
  debug: false,
  allowShowMiniToolBar: true, // 是否显示工具栏
  allowShowMiniNameFilter: false, // 是否显示搜索框
  defaultNodeShape: 0, // 默认的节点形状，0:圆形；1:矩形
  // defaultNodeColor: "rgba(66,187,66,1)",
  defaultJunctionPoint: "border",
  moveToCenterWhenResize: true, // 当图谱的大小发生变化时，是否重新让图谱的内容看起来居中
  hideNodeContentByZoom: true, // 是否根据缩放比例隐藏节点内容
  defaultNodeBorderWidth: 0,
  defaultNodeColor: "rgba(238, 178, 94, 1)",
  allowSwitchLineShape: true,
  allowSwitchJunctionPoint: true,
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

onMounted(() => {
  setGraphData()
})

// 点击节点触发的函数
const onNodeClick = (nodeObject) => {
  // 获取所有连线
  const graphInstance = graphRef.value!.getInstance()
  const allLinks = graphInstance.getLinks()

  allLinks.forEach((link) => {
    // 还原所有样式
    link.relations.forEach((line) => {
      line.color = line.data.orignColor || ""
      line.fontColor = line.data.orignFontColor || line.color || ""
      line.lineWidth = line.data.orignLineWidth || 1
    })
  })

  // 高亮与nodeObject相关的所有连线
  allLinks
    .filter((link) => link.fromNode === nodeObject || link.toNode === nodeObject)
    .forEach((link) => {
      link.relations.forEach((line) => {
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

const setGraphData = async () => {
  const __graph_json_data: RGJsonData = demoData
  const graphInstance = graphRef.value!.getInstance()
  await graphInstance.setJsonData(__graph_json_data)
}
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
