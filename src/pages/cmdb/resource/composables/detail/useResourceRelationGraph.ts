import { onMounted, ref, watch } from "vue"
import type { RGJsonData, RGNode, RGUserEvent, RelationGraphComponent } from "relation-graph-vue3"
import { findGraphApi, findLeftGraphApi, findRightGraphApi } from "@/api/resource"
import type { findGraphReq } from "@/api/resource/types/resource"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"

type UseResourceRelationGraphOptions = {
  activeName: string
  modelUid: string
  resourceId: string
  resourceName: string
}

type ResourceGraphModel = {
  model_uid: string
  model_name?: string
  icon?: string
}

type ResourceGraphData = RGJsonData & {
  models?: ResourceGraphModel[]
}

type ResourceGraphDetailNode = {
  modelUid: string
  modelName: string
  resourceId: string
  resourceName: string
}

export const useResourceRelationGraph = (options: UseResourceRelationGraphOptions) => {
  const { hasPermission } = usePermission()

  const graphRef = ref<RelationGraphComponent>()
  const loading = ref(true)
  const resourceGraphData = ref<RGJsonData>()
  const detailDrawerVisible = ref(false)
  const selectedDetailNode = ref<ResourceGraphDetailNode>()
  const canViewResourceDetail = hasPermission(CMDB_CAPABILITIES.Resource.Detail)

  const normalizeGraphData = (data: ResourceGraphData): RGJsonData => {
    const modelMap = new Map((data.models || []).map((model) => [model.model_uid, model]))
    const nodeIds = new Set((data.nodes || []).map((node) => node.id))

    return {
      ...data,
      nodes: (data.nodes || []).map((node) => {
        const model = modelMap.get(node.data?.model_uid)

        return {
          ...node,
          text: node.text || "未命名资源",
          data: {
            ...node.data,
            model_name: model?.model_name || node.data?.model_uid,
            icon: model?.icon
          }
        }
      }),
      lines: (data.lines || []).filter((line) => nodeIds.has(line.from) && nodeIds.has(line.to))
    }
  }

  const setGraphData = async () => {
    if (!resourceGraphData.value || !graphRef.value) return

    loading.value = false
    const graphInstance = graphRef.value.getInstance()
    await graphInstance.setJsonData(resourceGraphData.value)
    await graphInstance.moveToCenter()
    await graphInstance.zoomToFit()
  }

  const findRootResourceGraph = () => {
    loading.value = true
    findGraphApi({
      model_uid: options.modelUid,
      resource_id: parseInt(options.resourceId, 10),
      resource_name: options.resourceName
    })
      .then(({ data }) => {
        resourceGraphData.value = normalizeGraphData(data as ResourceGraphData)
        setGraphData()
      })
      .catch(() => {
        resourceGraphData.value = undefined
        loading.value = false
      })
  }

  const onNodeCollapse = () => {
    graphRef.value?.getInstance().doLayout()
  }

  const loadNodeGraph = async (node: RGNode) => {
    const requestOptions: findGraphReq = {
      model_uid: node.data!.model_uid,
      resource_id: parseInt(node.id, 10),
      resource_name: node.text!
    }

    const api =
      node.expandHolderPosition === "left" ? findLeftGraphApi(requestOptions) : findRightGraphApi(requestOptions)

    try {
      const { data } = await api
      return normalizeGraphData(data as ResourceGraphData)
    } catch {
      loading.value = false
      return undefined
    }
  }

  const expandNode = async (node: RGNode) => {
    const graphInstance = graphRef.value?.getInstance()
    if (!graphInstance) return

    loading.value = true
    const data = await loadNodeGraph(node)
    loading.value = false

    if (data) {
      graphInstance.appendJsonData(data)
      graphInstance.doLayout()
    }
  }

  const onNodeExpand = (node: RGNode, _event: RGUserEvent) => {
    expandNode(node)
  }

  const openNodeDetailDrawer = (node: RGNode) => {
    if (!canViewResourceDetail) return

    const modelUid = node.data?.model_uid
    const resourceId = node.id
    if (!modelUid || !resourceId) return

    selectedDetailNode.value = {
      modelUid,
      modelName: node.data?.model_name || modelUid,
      resourceId,
      resourceName: node.text || "未命名资源"
    }
    detailDrawerVisible.value = true
  }

  const clearNodeDetailDrawer = () => {
    selectedDetailNode.value = undefined
  }

  watch(
    () => options.activeName,
    (tabName) => {
      if (tabName === "resource-relation") {
        findRootResourceGraph()
      }
    }
  )

  onMounted(findRootResourceGraph)

  return {
    canViewResourceDetail,
    detailDrawerVisible,
    graphRef,
    loading,
    selectedDetailNode,
    clearNodeDetailDrawer,
    findRootResourceGraph,
    onNodeCollapse,
    onNodeExpand,
    openNodeDetailDrawer
  }
}
