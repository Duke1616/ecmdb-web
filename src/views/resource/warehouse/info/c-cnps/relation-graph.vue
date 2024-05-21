<template>
  <div style="width: 100%; height: 100%">
    <div v-loading="g_loading" style="width: 100%; height: calc(100vh - 200px)">
      <RelationGraph ref="graphRef" :options="graphOptions" @node-expand="onNodeExpand" @node-collapse="onNodeCollapse">
        <template #node="{ node }: { node: RGNode }">
          <div>
            <div style="width: 100px; cursor: pointer; text-align: left; padding: 0px">
              <div style="padding-left: 10px">{{ node.data!.model_uid }}</div>
              <div
                style="
                  background-color: #ffffff;
                  color: #555555;
                  padding-left: 10px;
                  /* padding-top: 10px; */
                  /* border-radius: 8px; */
                "
              >
                <div style="border-bottom: #efefef solid 1px">{{ node.text }}</div>
              </div>
            </div>
          </div>
        </template>
      </RelationGraph>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import RelationGraph from "relation-graph-vue3"
import type { RGJsonData, RGNode, RGOptions, RGUserEvent, RelationGraphComponent } from "relation-graph-vue3"
import { findGraphApi } from "@/api/resource"

interface Props {
  modelUid: string
  resourceId: string
  resourceName: string
}
const props = defineProps<Props>()

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
  moveToCenterWhenRefresh: true,
  zoomToFitWhenRefresh: true,
  useAnimationWhenRefresh: true,
  allowShowMiniToolBar: true,
  // defaultExpandHolderPosition: "left",
  defaultNodeShape: 1,
  defaultLineShape: 4,
  defaultNodeWidth: 100,
  defaultJunctionPoint: "lr",
  defaultNodeBorderWidth: 0,
  defaultLineColor: "rgba(0, 186, 189, 1)",
  defaultNodeColor: "rgba(0, 206, 209, 1)"
}

// onMounted(() => {
//   setGraphData()
// })

// const setGraphData = async () => {
//   const __graph_json_data: RGJsonData = {
//     rootId: "a",
//     nodes: [
//       { id: "a", text: "Root Node a" },
//       { id: "R-b", text: "R-b" },
//       { id: "R-c", text: "R-c", expandHolderPosition: "left" },
//       { id: "R-c-1", text: "R-c-1", expandHolderPosition: "left" },
//       { id: "R-c-1-1", text: "R-c-1-1" },
//       { id: "R-c-2", text: "R-c-2" },
//       { id: "R-d", text: "R-d" },
//       { id: "b", text: "b" },
//       { id: "c", text: "c", expandHolderPosition: "right" },
//       { id: "c1", text: "c1" },
//       { id: "c2", text: "c2" },
//       { id: "c3", text: "c3" },
//       { id: "d", text: "d" },
//       { id: "e", text: "e" }
//     ],
//     lines: [
//       { from: "R-b", to: "a" },
//       { from: "R-c", to: "a" },
//       { from: "R-c-1", to: "R-c" },
//       { from: "R-c-2", to: "R-c" },
//       { from: "R-c-1-1", to: "R-c-1" },
//       { from: "R-d", to: "a" },
//       { from: "a", to: "b" },
//       { from: "a", to: "c" },
//       { from: "c", to: "c1" },
//       { from: "c", to: "c2" },
//       { from: "c", to: "c3" },
//       { from: "a", to: "d" },
//       { from: "a", to: "e" }
//     ]
//   }

//   g_loading.value = false
//   const graphInstance = graphRef.value!.getInstance()
//   await graphInstance.setJsonData(__graph_json_data)
//   await graphInstance.moveToCenter()
//   await graphInstance.zoomToFit()
//   // await graphInstance.focusNodeById("a")
//   // await graphInstance.refresh()
// }

const setGraphData = async () => {
  if (resourceGraphData.value !== undefined) {
    const __graph_json_data: RGJsonData = resourceGraphData.value
    g_loading.value = false
    const graphInstance = graphRef.value!.getInstance()
    await graphInstance.setJsonData(__graph_json_data)
    await graphInstance.moveToCenter()
    await graphInstance.zoomToFit()
  }
}

const resourceGraphData = ref<RGJsonData>()
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
const findResourceGraph = () => {
  findGraphApi({
    model_uid: props.modelUid,
    resource_id: parseInt(props.resourceId, 10),
    resource_name: props.resourceName
  })
    .then(({ data }) => {
      resourceGraphData.value = data
      setGraphData()
    })
    .catch(() => {
      resourceGraphData.value = undefined
    })
    .finally(() => {})
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

onMounted(() => {
  findResourceGraph()
})
</script>

<style scoped>
.c-node-menu-item {
  line-height: 30px;
  padding-left: 10px;
  cursor: pointer;
  color: #444444;
  font-size: 14px;
  border-top: #efefef solid 1px;
}
.c-node-menu-item:hover {
  background-color: rgba(66, 187, 66, 0.2);
}
.c-person-pic {
  width: 120px;
  border-radius: 50%;
  margin-top: 10px;
}
</style>
