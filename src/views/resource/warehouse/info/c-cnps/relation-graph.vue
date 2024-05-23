<template>
  <div style="width: 100%; height: 100%">
    <div v-loading="g_loading" style="width: 100%; height: calc(100vh - 200px)">
      <RelationGraph ref="graphRef" :options="graphOptions" @node-expand="onNodeExpand" @node-collapse="onNodeCollapse">
        <template #node="{ node }: { node: RGNode }">
          <div>
            <div style="width: 100px; cursor: pointer; text-align: left; padding: 0px">
              <div style="padding-left: 10px">{{ node.data!.model_uid }}</div>
              <div style="background-color: #ffffff; color: #555555; padding-left: 10px">
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

  g_loading.value = true
  loadChildNodesFromRemoteServer(node, (new_data) => {
    g_loading.value = false
    graphInstance.appendJsonData(new_data)
    graphInstance.doLayout()
  })
}

const addResourceGraph = async (modelUid: string, resourceId: number, resourceName: string) => {
  const addResourceGraphData = ref<RGJsonData | undefined>()
  try {
    const { data } = await findGraphApi({
      model_uid: modelUid,
      resource_id: resourceId,
      resource_name: resourceName
    })
    addResourceGraphData.value = data
  } catch (error) {
    addResourceGraphData.value = undefined
  }
  return addResourceGraphData.value
}

const loadChildNodesFromRemoteServer = async (node: RGNode, callback: (new_data: RGJsonData) => void) => {
  const resource = await addResourceGraph(node.data!.model_uid, parseInt(node.id, 10), node.text!)
  if (resource) {
    callback(resource)
  }
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
