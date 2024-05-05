<template>
  <div>
    <div ref="myPage" style="margin-top: 0px; width: calc(100% - 10px); height: calc(100vh)">
      <RelationGraph ref="graphRef" :options="graphOptions">
        <template #node="{ node }">
          <div class="my-node-style" :style="{ 'background-image': 'url(' + node.data.icon + ')' }" />
          <div class="c-node-name" :style="{ color: node.color }">{{ node.text }}</div>

          <!-- <div @mouseover="showNodeTips(node, $event)" @mouseout="hideNodeTips(node, $event)">
            <div class="c-my-rg-node">
              <i style="font-size: 30px" :class="node.data.myicon" />
            </div>
            <div
              style="
                color: forestgreen;
                font-size: 16px;
                position: absolute;
                width: 160px;
                height: 25px;
                line-height: 25px;
                margin-top: 5px;
                margin-left: -48px;
                text-align: center;
                background-color: rgba(66, 187, 66, 0.2);
              "
            >
              {{ node.text }}
            </div>
          </div> -->
        </template>

        <template #graph-plug>
          <div
            style="
              position: absolute;
              z-index: 700;
              left: 20px;
              top: 20px;
              height: 110px;
              padding-top: 6px;
              padding-left: 30px;
              padding-right: 30px;
              border: #efefef solid 1px;
              color: #555555;
              border-radius: 10px;
              background-color: rgba(255, 255, 255, 0.79);
              font-size: 12px;
            "
          >
            <!-- <div style="">
              <div style="line-height: 20px">Node Filter:</div>
              <el-radio-group v-model="checked_sex" size="small" @change="doFilter">
                <el-radio-button label="">All</el-radio-button>
                <el-radio-button label="male" />
                <el-radio-button label="female" />
              </el-radio-group>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <el-radio-group v-model="checked_isgoodman" size="small" style="margin-left: 50px" @change="doFilter">
                <el-radio-button label="">All</el-radio-button>
                <el-radio-button :label="true">Positive</el-radio-button>
                <el-radio-button :label="false">Negative</el-radio-button>
              </el-radio-group>
            </div>
            <div>
              <div style="line-height: 20px">Relation Filter:</div>
              <el-checkbox-group v-model="rel_checkList" @change="doFilter">
                <el-checkbox v-for="thisItem in all_rel_type" :key="thisItem" :label="thisItem" />
              </el-checkbox-group>
            </div> -->

            <!-- <div style="">
              <el-button @click="doAction1()">定位到祁同伟</el-button>
            </div> -->
          </div>
        </template>
      </RelationGraph>
      <div
        v-if="isShowNodeTipsPanel"
        :style="{ left: nodeMenuPanelPosition.x + 'px', top: nodeMenuPanelPosition.y + 'px' }"
        style="
          z-index: 999;
          padding: 10px;
          background-color: #ffffff;
          border: #eeeeee solid 1px;
          box-shadow: 0px 0px 8px #cccccc;
          position: absolute;
        "
      >
        <div style="line-height: 25px; padding-left: 10px; color: #888888; font-size: 12px">
          Node Name: {{ currentNode.text }}
        </div>
        <div class="c-node-menu-item">id: {{ currentNode.text }}</div>
        <div class="c-node-menu-item">icon: {{ currentNode.data.myicon }}</div>
      </div>
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

const myPage = ref()
const isShowNodeTipsPanel = ref(false)
const nodeMenuPanelPosition = ref({ x: 0, y: 0 })
const currentNode = ref({})

const graphRef = ref<RelationGraphComponent>()
const checked_sex = ref("")
const checked_isgoodman = ref("")
const rel_checkList = ref(["师生", "上下级", "亲戚", "情人", "朋友", "夫妻", "勾结", "腐化", "举报"])
const all_rel_type = ref(["师生", "上下级", "亲戚", "情人", "朋友", "夫妻", "勾结", "腐化", "举报"])

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
  await graphInstance.moveToCenter()
  await graphInstance.zoomToFit()
}

const doFilter = () => {
  const graphInstance = graphRef.value!.getInstance()
  const _all_nodes = graphInstance.getNodes()
  const _all_links = graphInstance.getLinks()
  _all_nodes.forEach((thisNode) => {
    let _isHideThisLine = false
    if (checked_sex.value !== "") {
      if (thisNode.data["sexType"] !== checked_sex.value) {
        _isHideThisLine = true
      }
    }
    if (checked_isgoodman.value !== "") {
      if (thisNode.data["isGoodMan"] !== checked_isgoodman.value) {
        _isHideThisLine = true
      }
    }
    thisNode.opacity = _isHideThisLine ? 0.1 : 1
  })
  _all_links.forEach((thisLink) => {
    thisLink.relations.forEach((thisLine) => {
      if (rel_checkList.value.indexOf(thisLine.data["type"]) === -1) {
        if (!thisLine.isHide) {
          thisLine.isHide = true
          console.log("Hide line:", thisLine)
        }
      } else {
        if (thisLine.isHide) {
          thisLine.isHide = false
          console.log("Show line:", thisLine)
        }
      }
    })
  })
  graphInstance.dataUpdated()
}

function doAction1() {
  const graph = graphRef.value!.getInstance()
  // const graph = this.$refs.seeksRelationGraph.getInstance()
  graph.focusNodeById("virtual")
  graph.getNodeById("virtual").borderColor = "#000000"
  graph.getNodeById("virtual").fontColor = "#000000"
}

// const showNodeTips = (nodeObject, $event) => {
//   currentNode.value = nodeObject
//   const _base_position = myPage.value.getBoundingClientRect()
//   console.log("showNodeMenus:", $event.clientX, $event.clientY, _base_position)
//   isShowNodeTipsPanel.value = true
//   nodeMenuPanelPosition.value.x = $event.clientX - _base_position.x + 10
//   nodeMenuPanelPosition.value.y = $event.clientY - _base_position.y + 10
// }

// const hideNodeTips = (nodeObject, $event) => {
//   console.log(nodeObject, $event)
//   isShowNodeTipsPanel.value = false
// }
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

// .c-my-rg-node {
//   height: 80px;
//   line-height: 80px;
//   border-radius: 50%;
//   cursor: pointer;
//   display: flex;
//   place-items: center;
//   justify-content: center;
// }
// .c-node-menu-item {
//   line-height: 30px;
//   padding-left: 10px;
//   cursor: pointer;
//   color: #444444;
//   font-size: 14px;
//   border-top: #efefef solid 1px;
// }
// .c-node-menu-item:hover {
//   background-color: rgba(66, 187, 66, 0.2);
// }
</style>
