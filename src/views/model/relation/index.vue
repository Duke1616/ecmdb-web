<template>
  <div>
    <div style="margin-top: 0px; width: calc(100% - 10px); height: calc(100vh)">
      <RelationGraph ref="graphRef" :options="graphOptions">
        <template #node="{ node }">
          <div class="my-node-style" :style="{ 'background-image': 'url(' + node.data.icon + ')' }" />
          <div class="c-node-name" :style="{ color: node.color }">{{ node.text }}</div>
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
            <div style="">
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
            </div>
          </div>
        </template>
      </RelationGraph>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import RelationGraph, {
  RGJsonData,
  RGOptions,
  RGNode,
  RGLine,
  RGLink,
  RGUserEvent,
  RelationGraphComponent
} from "relation-graph-vue3"
import demoData from "./Demo4AdvDataFilterData.json"

const graphOptions: RGOptions = {
  debug: false,
  defaultNodeBorderWidth: 0,
  defaultNodeColor: "rgba(238, 178, 94, 1)",
  allowSwitchLineShape: true,
  allowSwitchJunctionPoint: true,
  defaultLineShape: 1,
  layouts: [
    {
      label: "Auto Layout",
      layoutName: "force",
      layoutClassName: "seeks-layout-force"
    }
  ],
  defaultJunctionPoint: "border"
}

const graphRef = ref<RelationGraphComponent>()
const checked_sex = ref("")
const checked_isgoodman = ref("")
const rel_checkList = ref(["师生", "上下级", "亲戚", "情人", "朋友", "夫妻", "勾结", "腐化", "举报"])
const all_rel_type = ref(["师生", "上下级", "亲戚", "情人", "朋友", "夫妻", "勾结", "腐化", "举报"])

onMounted(() => {
  setGraphData()
})

const setGraphData = async () => {
  const __graph_json_data: RGJsonData = demoData
  const graphInstance = graphRef.value!.getInstance()
  await graphInstance.setJsonData(__graph_json_data)
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
