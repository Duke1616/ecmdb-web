<template>
  <div>
    <div v-loading="g_loading" style="height: calc(100vh - 200px)">
      <RelationGraph ref="graphRef" :options="graphOptions" @node-expand="onNodeExpand" @node-collapse="onNodeCollapse">
        0
      </RelationGraph>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import RelationGraph from "relation-graph-vue3"
import type { RGJsonData, RGNode, RGOptions, RGUserEvent, RelationGraphComponent } from "relation-graph-vue3"

const graphRef = ref<RelationGraphComponent>()
const g_loading = ref(true)

const graphOptions: RGOptions = {
  layouts: [
    {
      label: "Center",
      layoutName: "tree",
      layoutClassName: "seeks-layout-center",
      from: "left",
      max_per_width: 300,
      min_per_height: 40
    }
  ],
  defaultLineMarker: {
    markerWidth: 12,
    markerHeight: 12,
    refX: 6,
    refY: 6,
    data: "M2,2 L10,6 L2,10 L6,6 L2,2"
  },
  moveToCenterWhenRefresh: false,
  defaultExpandHolderPosition: "right",
  defaultNodeShape: 1,
  defaultNodeWidth: 100,
  defaultLineShape: 4,
  defaultJunctionPoint: "lr",
  defaultNodeBorderWidth: 0,
  defaultLineColor: "rgba(0, 186, 189, 1)",
  defaultNodeColor: "rgba(0, 206, 209, 1)"
}

onMounted(() => {
  setGraphData()
})

const setGraphData = async () => {
  const __graph_json_data: RGJsonData = {
    rootId: "a",
    nodes: [
      { id: "a", text: "a" },
      { id: "b", text: "b-固定数据展开/关闭" },
      { id: "b1", text: "b1" },
      { id: "b1-1", text: "b1-1" },
      { id: "b1-2", text: "b1-2" },
      { id: "b1-3", text: "b1-3" },
      { id: "b1-4", text: "b1-4" },
      { id: "b1-5", text: "b1-5" },
      { id: "b1-6", text: "b1-6" },
      { id: "b2", text: "b2" },
      { id: "b2-1", text: "b2-1" },
      { id: "b2-2", text: "b2-2" },
      { id: "c", text: "c-动态数据展开/关闭" },
      {
        id: "c1",
        text: "c1-动态获取子节点",
        expandHolderPosition: "right",
        expanded: false,
        data: { isNeedLoadDataFromRemoteServer: true, childrenLoaded: false }
      },
      {
        id: "c2",
        text: "c2-动态获取子节点",
        expandHolderPosition: "right",
        expanded: false,
        data: { isNeedLoadDataFromRemoteServer: true, childrenLoaded: false }
      },
      {
        id: "c3",
        text: "c3-动态获取子节点",
        expandHolderPosition: "right",
        expanded: false,
        data: { isNeedLoadDataFromRemoteServer: true, childrenLoaded: false }
      }
    ],
    lines: [
      { from: "a", to: "b" },
      { from: "b", to: "b1" },
      { from: "b1", to: "b1-1" },
      { from: "b1", to: "b1-2" },
      { from: "b1", to: "b1-3" },
      { from: "b1", to: "b1-4" },
      { from: "b1", to: "b1-5" },
      { from: "b1", to: "b1-6" },
      { from: "b", to: "b2" },
      { from: "b2", to: "b2-1" },
      { from: "b2", to: "b2-2" },
      { from: "a", to: "c" },
      { from: "c", to: "c1" },
      { from: "c", to: "c2" },
      { from: "c", to: "c3" }
    ]
  }

  console.log(JSON.stringify(__graph_json_data))
  g_loading.value = false
  const graphInstance = graphRef.value!.getInstance()
  await graphInstance.setJsonData(__graph_json_data)
  await graphInstance.moveToCenter()
  await graphInstance.zoomToFit()
}

const onNodeCollapse = () => {
  const graphInstance = graphRef.value!.getInstance()
  graphInstance.doLayout()
}

const onNodeExpand = (node: RGNode, $event: RGUserEvent): void => {
  console.log($event)
  const graphInstance = graphRef.value!.getInstance()

  // 检查 node.data 是否存在
  const nodeData = node.data
  if (!nodeData) {
    console.error("Node data is undefined")
    return // 或者执行其他适当的错误处理
  }

  if (!nodeData.isNeedLoadDataFromRemoteServer) {
    console.log("These child nodes have already been loaded")
    graphInstance.doLayout()
    return
  }
  if (nodeData.childrenLoaded) {
    console.log("These child nodes have already been loaded")
    graphInstance.doLayout()
    return
  }

  g_loading.value = true
  nodeData.childrenLoaded = true
  loadChildNodesFromRemoteServer(node, (new_data) => {
    g_loading.value = false
    graphInstance.appendJsonData(new_data)
    graphInstance.doLayout()
  })
}

const loadChildNodesFromRemoteServer = (node: RGNode, callback: (new_data: RGJsonData) => void) => {
  setTimeout(function () {
    const _new_json_data: RGJsonData = {
      nodes: [
        { id: node.id + "-child-1", text: node.id + "-的动态子节点1", width: 150 },
        { id: node.id + "-child-2", text: node.id + "-的动态子节点2", width: 150 },
        { id: node.id + "-child-3", text: node.id + "-的动态子节点3", width: 150 }
      ],
      lines: [
        { from: node.id, to: node.id + "-child-1", text: "Dynamic child node" },
        { from: node.id, to: node.id + "-child-2", text: "Dynamic child node" },
        { from: node.id, to: node.id + "-child-3", text: "Dynamic child node" }
      ]
    }
    callback(_new_json_data)
  }, 1000)
}
</script>

<style scoped></style>
